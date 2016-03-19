(function ($, root, undefined) {    
    var functionName = "f";
    var functionVariable = "x";
    var endCaps = ["infty", -10, "infty", 10];   
    // TODO: Remove endcaps

    var pngCanvas = document.createElement("canvas");;

    var ticks = [];
    var spacings = [{
        "type": "increasing"
    }];

    $(document).ready(function () {
        $("#ticksList").change(updateMonotoniLinje);

        $('#btnDraw').click(updateMonotoniLinje);
        $('#btnPNG').click(openPNG);

        $("#functionName").change(updateFunctionName);
        $("#functionVariable").change(updateFunctionName);

        handleSVGResizer();
        updateMonotoniLinje();
    });

    function updateFunctionName() {
        var fn = $("#functionName");
        var fv = $("#functionVariable");

        functionName = fn.val();
        functionVariable = fv.val();
        $("#dRdesc").html("Dm(" + functionName + ") =");
        $("#forskriftDesc").html(functionName + "'(" + functionVariable + ") =");
        $("#nulpunkterDesc").html(functionVariable + " =");

        updateMonotoniLinje();
    }

    function openPNG() {
        window.open(pngCanvas.toDataURL("image/png"));
    }

    function updatePNG() {
        var svg = document.getElementById("svg");
        var i = 0;
        canvg(pngCanvas, new XMLSerializer().serializeToString(svg), {
            scaleWidth: svg.getAttribute("width") * 2,
            scaleHeight: svg.getAttribute("height") * 2,
            forceRedraw: function () {
                if (i++ < 2) {
                    return true;
                }
                return false;
            }
        });
    }

    function handleSVGResizer() {
        var svg = $("#svg");
        var drag = $("#svgDragger");
        drag.css("left", svg.attr("width") - 5 + "px");
        drag.css("top", svg.attr("height") - 5 + "px");

        var dragging = false;
        drag.mousedown(function () {
            dragging = true;
        });
        $(document).mousemove(function (e) {
            if (dragging) {
                svg = $("#svg");

                var parentOffset = $("#svgContainer").offset();
                var mouseX = (e.pageX - parentOffset.left);
                var mouseY = (e.pageY - parentOffset.top);

                svg.attr("width", mouseX);
                svg.attr("height", mouseY);

                drag.css("left", mouseX - 5 + "px");
                drag.css("top", mouseY - 5 + "px");

                updateMonotoniLinje();
            }
        });
        $(document).mouseup(function () {
            dragging = false;
        });
    }

    function updateMonotoniLinje () {
        // Check if any ticks have been added or removed
        var tickInput = $("#ticksList").data('value');
        var newTicks = [];
        var newSpacings = [spacings[0]];

        var tickIndex = 0;
        for (var i = 0; i < tickInput.length; i++)
        {
            // These ticks have been deleted
            while (tickIndex < ticks.length && tickInput[i] > ticks[tickIndex]["number"]) {tickIndex++}

            if (tickIndex < ticks.length && ticks[tickIndex]["number"] == tickInput[i]) {
                // This tick is already in the list
                newTicks.push(ticks[tickIndex]);
                newSpacings.push(spacings[tickIndex + 1]);
            } else {
                // The tick is not in the list
                var border = newSpacings[newSpacings.length - 1].type == "undefined"; // Whether this tick should be added in bordermode
                newTicks.push({
                    "number": tickInput[i],    // The x-value of this tick
                    "type": "zero",            // The type
                    "borderType": "included",  // The type when next to an undefined spacing
                    "isBorder": border,        // Whether the tick is next to an undefined spacing
                    "isGlobal": false,         // Whether this tick will be a global min / max or a local one
                });
                newSpacings.push({
                    "type": "increasing"
                });
            }
        }

        ticks = newTicks;
        spacings = newSpacings;

        drawMonotoniLinje();
    }

    function drawMonotoniLinje () {
        var svg = Snap("#svg");
        var svgWidth = svg.attr("width");
        svg.clear();

        // Create the hatching pattern for the undefined spacings
        var hatchingPattern = svg.line(0, 0, 0, 10).attr({
            stroke: "#000000",
            strokeWidth: 1
        }).toPattern(0, 0, 10, 10).attr({
            patternTransform: "rotate(45 0 0)",
            patternUnits: "userSpaceOnUse"
        });
        var hatchingGroup = svg.g();

        // Create a group for the thick lines
        var lineGroup = svg.g();
        lineGroup.attr({
            stroke: "#000000",
            strokeWidth: 2
        });

        // Draw the line itself
        var arrowStart = svgWidth - 14;
        lineGroup.add(svg.line(0, 50, arrowStart + 1, 50));
        arrowhead = svg.polyline([arrowStart, 45, arrowStart, 55, svgWidth - 2, 50]);
        arrowhead.attr({
            fill: "#000000"
        });

        var totalSteps = ticks.length * 2 + 3;
        if (endCaps[0] != "infty") totalSteps += 1;
        if (endCaps[2] != "infty") totalSteps += 1;

        var step = svgWidth/totalSteps;

        // Add variable names
        var varNames = svg.g();
        varNames.attr({
            textAnchor: "end",
            fill: "black",
            fontStyle: "italic",
            fontFamily: "CMU",
        });
        varNames.add(svg.text((step - 5), 40, functionVariable));
        varNames.add(svg.text((step - 5), 70, functionName + ' \'(' + functionVariable + ")"));
        varNames.add(svg.text((step - 5), 100, functionName + '(' + functionVariable + ")"));

        var valueGroup = svg.g();
        valueGroup.attr({
            textAnchor: "middle",
            fill: "black",
            fontFamily: "CMU",
        });

        // A group for highlight effects
        var highlightGroup = svg.g();
        highlightGroup.attr({
            "fill": "transparent"
        });

        // Add ticks and spacings
        for (var i = 0; i < spacings.length; i++) {
            var spacing = spacings[i];
            var x = 0;

            // Draw the tick (the first spacing doesn't have an associated tick)
            if (i > 0) {
                var tick = ticks[i - 1];
                x = (i * 2 + 1) * step;
                
                var tickHighlightHeight = "100%"; // How tall the highlight effect on the tick should be
                valueGroup.add(svg.text(x, 40, tick["number"].toString())); // Draw the x value

                if (tick["isBorder"] == false && tick["type"] == "zero") {
                    lineGroup.add(svg.line(x, 45, x, 55)); // Draw the actual tick
                    valueGroup.add(svg.text(x, 70, "0")); // Draw the derivative value

                    // Draw min / max
                    var minmax = "";
                    minmax += spacings[i - 1]["type"] == "increasing" ? "+" : "-";
                    minmax += spacing["type"] == "increasing" ? "+" : "-";

                    if (minmax == "+-" || minmax == "-+")  {
                        valueGroup.add(svg.text(x, 100, tick["isGlobal"] ? "glob" : "lok"));

                        highlightGroup.add(svg.rect(x - 20, 85, 40, "100%") // Add change local / global functionality
                            .addClass('highlight')
                            .attr({"data-tick-id": i - 1})
                            .click(swapGlobal));
                        tickHighlightHeight = 80; // Decrease the size of the tick highlight so it doesn't overlap
                    }

                    if (minmax == "+-") {
                        valueGroup.add(svg.text(x, 113, "maks.")); 
                    } else if (minmax == "-+") {
                        valueGroup.add(svg.text(x, 113, "min.")); 
                    }

                } else if ((tick["isBorder"] && tick["borderType"] == "excluded") || (! tick["isBorder"] && tick.type == "undefined")) {
                    // Draw a dotted line
                    lineGroup.add(svg.line(x, 45, x, "100%").attr({"strokeLinecap": "round", "strokeDasharray": "1, 6"}));
                } else if ((tick["isBorder"] && tick["borderType"] == "included")) {
                    // Draw a solid line
                    lineGroup.add(svg.line(x, 45, x, "100%"));
                }

                highlightGroup.add(svg.rect(x - 5, 0, 10, tickHighlightHeight) // Add mouseover highlight and change type functionality
                    .addClass('highlight')
                    .attr({"data-tick-id": i - 1})
                    .click(swapTick));
            }

            // Draw the spacing
            x = ((i + 1) * 2) * step;
            highlightGroup.add(svg.rect(x - 0.5 * step, 0, step, "100%") // Add mouseover highlight and change functionality
                .addClass('highlight')
                .attr({"data-spacing-id": i})
                .click(swapSpacing));

            if (spacing["type"] == "increasing" || spacing["type"] == "decreasing") {
                valueGroup.add(svg.text(x, 70, (spacing["type"] == "increasing" ? "+" : "-")));
                valueGroup.add(svg.text(x, 100, (spacing["type"] == "increasing" ? "↗" : "↘"))); 
            } else if (spacing["type"] == "undefined") {
                hatchingGroup.add(svg.rect(x - step, 50, 2 * step, "100%").attr({ fill: hatchingPattern }));
            }
        }
    }

    // Changes the tick to another type
    function swapTick(e) {
        var tick = ticks[$(e.target).attr("data-tick-id")];

        if (tick["isBorder"]) {
            // Swap the border type
            if (tick["borderType"] == "included") {
                tick["borderType"] = "excluded";
            } else {
                tick["borderType"] = "included";
            }
        } else {
            // Swap regular type
            if (tick["type"] == "zero") {
                tick["type"] = "undefined";
            } else {
                tick["type"] = "zero";
            }
        }

        updateMonotoniLinje();
    }

    // Changes ticks between global and local minima / maxima
    function swapGlobal(e) {
        var tick = ticks[$(e.target).attr("data-tick-id")];
        tick["isGlobal"] = ! tick["isGlobal"];

        drawMonotoniLinje();
    }

    // Changes the spacing to another type
    function swapSpacing(e) {
        var spacingID = parseInt($(e.target).attr("data-spacing-id"));
        var spacing = spacings[$(e.target).attr("data-spacing-id")];

        if (spacing["type"] == "increasing") {
            spacing["type"] = "decreasing";
        } else if (spacing["type"] == "decreasing") {
            spacing["type"] = "undefined";

            // Change the bordering ticks to border mode
            if (spacingID < ticks.length) ticks[spacingID]["isBorder"] = true;
            if (spacingID > 0) ticks[spacingID - 1]["isBorder"] = true;
        } else {
            spacing["type"] = "increasing";

            // Change the bordering ticks off border mode
            if (spacingID > 0) { 
                if (spacings[spacingID - 1]["type"] != "undefined") { // Check if the spacing to the left is defined
                    ticks[spacingID - 1]["isBorder"] = false;
                }
            }

            if (spacingID < ticks.length) {
                if (spacings[spacingID + 1]["type"] != "undefined") { // Check if the spacing to the right is defined
                    ticks[spacingID]["isBorder"] = false;
                }
            }
        }

        updateMonotoniLinje();
    }

})(jQuery, this);