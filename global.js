(function ($, root, undefined) {    
    var nulpunkter = [];
    var functionName = "f";
    var functionVariable = "x";
    var endCaps = ["infty", -10, "infty", 10];   

    var pngCanvas = document.createElement("canvas");;

    $(document).ready(function () {
        handleNulpunkter();

        $('#btnDraw').click(updateMonotoniLinje);
        $('#btnPNG').click(openPNG);

        $('.interval').click(changeDRType);
        $('.interval input').change(updateDR);

        $("#functionName").change(updateFunctionName);
        $("#functionVariable").change(updateFunctionName);

        handleSVGResizer();
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

    function handleNulpunkter() {
        $("#nulpunkter").click(function () {
            $("#nulpunkterInput").focus();
        });

        $("#nulpunkterInput").keydown(function (e) {
            if (e.keyCode == 32) {
                addNulpunkt();

                updateMonotoniLinje();
            } else if (e.keyCode == 8) {
                if (nulpunkter.length > 0) {
                    nulpunkter.pop().remove();
                }

                updateMonotoniLinje();
            }
        });
    }

    // Updates the definition range for the function
    function updateDR() {
        var $dRl = $("#dR .interval.left");
        if ($dRl.hasClass("infty")) {
            endCaps[0] = "infty";
        } else if ($dRl.hasClass("open")) {
            endCaps[0] = "open";
        } else {
            endCaps[0] = "closed";
        }
        endCaps[1] = Number($dRl.find("input").val());

        var $dRr = $("#dR .interval.right");
        if ($dRr.hasClass("infty")) {
            endCaps[2] = "infty";
        } else if ($dRr.hasClass("open")) {
            endCaps[2] = "open";
        } else {
            endCaps[2] = "closed";
        }
        endCaps[3] = Number($dRr.find("input").val());

        updateMonotoniLinje();
    }

    function changeDRType (e) {
        var $e = $(e.target);
        if ($e.hasClass("infty")) {
            $e.removeClass("infty");
            $e.addClass("open");
        } else if ($e.hasClass("open")) {
            $e.removeClass("open");
        } else {
            $e.addClass("infty");
        }

        updateDR();
    }

    function addNulpunkt() {
        var point = parseFloat($("#nulpunkterInput").val());
        $("#nulpunkterInput").val("");
        if (isNaN(point)) {
            return; // Drop the point, it isn't interesting
        }

        var nulpunkt = $('<span class="label label-default">' + point + '</span>');
        nulpunkt.data("value", point);

        var inserted = false;
        // Insert the zero-point back into the array
        for (var i = 0; i < nulpunkter.length; i++) {
            var val = nulpunkter[i].html();
            if (val == point) {
                return; // Don't add the point twice
            } else if (val > point) {
                nulpunkter[i].before(nulpunkt);
                nulpunkter.splice(i, 0, nulpunkt);
                inserted = true;
                break;
            }
        }

        if (! inserted) {
            nulpunkter.push(nulpunkt);
            $("#nulpunktsContainer").append(nulpunkt);
        }
    }

    function updateMonotoniLinje () {
        var ticks = [];
        var x = 0;
        var firstZeroPoint = nulpunkter[0].data("value");

        // If the first zero point isn't the start of the definition range evaluate before the first zero point 
        if (endCaps[0] != "closed" || firstZeroPoint != endCaps[1]) {
            x = endCaps[0] == "infty" ? firstZeroPoint - 10 : (firstZeroPoint + endCaps[1]) * 0.5;
            ticks.push([x, evalExpressionAt(x)]);
        }

        for (var i = 0; i < nulpunkter.length; i++) {
            var zeroPoint = nulpunkter[i].data("value");
            ticks.push([zeroPoint, 0]);

            // Evaluate between this zero point and the next
            if (i < nulpunkter.length - 1) {
                x = (zeroPoint + nulpunkter[i + 1].data("value")) * 0.5;
                ticks.push([x, evalExpressionAt(x)]);
            }
        }

        // if the last zero point isn't the end of the definition range evaluate after the last zero point
        var lastZeroPoint = nulpunkter[nulpunkter.length -1].data("value");
        if (endCaps[2] != "closed" || lastZeroPoint != endCaps[3]) {
            x = endCaps[2] == "infty" ? lastZeroPoint + 10 : (lastZeroPoint + endCaps[3]) * 0.5;
            ticks.push([x, evalExpressionAt(x)]);
        }

        drawMonotoniLinje(ticks);
        updatePNG();
    }

    function drawMonotoniLinje (ticks) {
        var svg = Snap("#svg");
        var svgWidth = svg.attr("width");
        svg.clear();

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

        var totalSteps = ticks.length + 2;
        if (endCaps[0] != "infty") totalSteps += 1;
        if (endCaps[2] != "infty") totalSteps += 1;

        var step = svgWidth/totalSteps;
        var currentStep = 0;

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

        if (endCaps[0] != "infty") {
            currentStep = 3;
        } else {
            currentStep = 2;
        }

        var valueGroup = svg.g();
        valueGroup.attr({
            textAnchor: "middle",
            fill: "black",
            fontFamily: "CMU",
        });

        // Add the first point
        for (var i = 0; i < ticks.length; i++) {
            var x = currentStep * step;
            var tick = ticks[i];
        
            if (tick[1] == 0) {
                // This point is a zeropoint

                // Draw the x value
                valueGroup.add(svg.text(x, 40, tick[0].toString()));
                // Draw the actual tick
                lineGroup.add(svg.line(x , 45, x, 55));
                // Draw the derivative value
                valueGroup.add(svg.text(x, 70, "0"));
                
                // Draw whether it's a local minimum or maximum
                var type = i > 0 ? (ticks[i - 1][1] > 0 ? '+' : '-') : "/";
                type += i < ticks.length - 1 ? (ticks[i + 1][1] > 0 ? '+' : '-') : "/";

                if (type == "/-" || type == "+-" || type == "-/" || type == "-+")  {
                    valueGroup.add(svg.text(x, 100, "lok"));
                }

                if (type == "/-" || type == "+-") {
                    valueGroup.add(svg.text(x, 113, "maks.")); 
                } else if (type == "-/" || type == "-+") {
                    valueGroup.add(svg.text(x, 113, "min.")); 
                }
            } else {
                // This point is not a zeropoint
                valueGroup.add(svg.text(x, 70, (tick[1] > 0 ? "+" : "-")));
                valueGroup.add(svg.text(x, 100, (tick[1] > 0 ? "↗" : "↘"))); 
            }

            // Increase the step, so that the next tick gets moved accordingly
            currentStep++;
        }

        // Draw the definition range
        drawDR(svg, step, svgWidth, valueGroup, lineGroup);
    }

    function drawDR (svg, step, svgWidth, valueGroup, lineGroup) {
        var $dRl = $($("#dR .interval")[0]);

        // Create the hatches pattern for the unincluded areas of the line
        var DRPatternLine = svg.line(0, 0, 0, 10);
        DRPatternLine.attr({
            stroke: "#000000",
            strokeWidth: 1
        });
        var DRPattern = DRPatternLine.toPattern(0, 0, 10, 10);
        DRPattern.attr({
            patternTransform: "rotate(45 0 0)",
            patternUnits: "userSpaceOnUse"
        });

        if (!$dRl.hasClass("infty")) {
            lineGroup.add(svg.line(step * 2, 45, step * 2, 55));
            valueGroup.add(svg.text(step * 2, 40, $dRl.find("input").val()));
            svg.rect(step, 50, step, "100%").attr({ fill: DRPattern });
        
            var DRLine = svg.line(step * 2, 50, step * 2, "100%");
            if ($dRl.hasClass("open")) {
                DRLine.attr({ stroke: "#000000", strokeWidth: 2, "strokeLinecap": "round", "strokeDasharray": "1, 6"});
            } else {
                DRLine.attr({ stroke: "#000000", strokeWidth: 2});
            }
        }

        var $dRr = $($("#dR .interval")[1]);
        if (!$dRr.hasClass("infty")) {
            lineGroup.add(svg.line(svgWidth - step, 45, svgWidth - step, 55));
            valueGroup.add(svg.text(svgWidth - step, 40, $dRr.find("input").val()));
            svg.rect(svgWidth - step, 50, step, "100%").attr({ fill: DRPattern });
        
            var DRLine = svg.line(svgWidth - step, 50, svgWidth - step, "100%");
            if ($dRr.hasClass("open")) {
                DRLine.attr({ stroke: "#000000", strokeWidth: 2, "strokeLinecap": "round", "strokeDasharray": "1, 6"});
            } else {
                DRLine.attr({ stroke: "#000000", strokeWidth: 2});
            }
        }
    }

    function evalExpressionAt(x) {
        var variable = {};
        variable[functionVariable] = x;
        return math.eval($('#forskrift').val(), variable);
    }

    $.fn.xml = function() {
        return (new XMLSerializer()).serializeToString(this[0]);
    };

    $.fn.DOMRefresh = function() {
        return $($(this.xml()).replaceAll(this));
    };
})(jQuery, this);