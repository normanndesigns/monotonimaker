(function ($, root, undefined) {  
    const { remote } = require('electron');
    const dialog = require('electron').remote.dialog
    const { BrowserWindow } = remote;
    var fs = require('fs');

    var nulpunkter = [];
    var functionName = "f";
    var functionVariable = "x";
    var endCaps = ["infty", -10, "infty", 10];   
    var nulPunkterOnLoad = [-2, 0]

    var close = $('#closeBTN').click(closeWindow)
    var minimize = $('#minimizeBTN').click(minimizeWindow)
    var maximize = $('#maximizeBTN').click(maximizeWindow)

    function closeWindow(){
        var window = remote.getCurrentWindow();
        window.close();
    }
    function minimizeWindow(){
        var window = remote.getCurrentWindow();
        window.minimize();
    }
    function maximizeWindow(){
        var window = remote.getCurrentWindow();
        if(screen.availWidth === window.getSize()[0] && screen.availHeight === window.getSize()[1]){
            window.setSize(Size[0], Size[1]);
        }else{
            Position = [window.getPosition[0], window.getPosition[1]]
            Size = [window.getSize()[0], window.getSize()[1]]
            window.maximize();
        }
    }
    
    $(document).ready(function () {
        if (nulPunkterOnLoad != []){
            nulPunkterOnLoad.forEach(element => {
                addNulpunkt(element);
            });
            nulPunkterOnLoad = [];
        }
        updateMonotoniLinje();
        
        handleNulpunkter();

        $('#btnDraw').click(function () {
            updateMonotoniLinje();
            return false;
        });

        $('.interval').click(changeDRType);
        $('.interval input').change(updateDR);

        $("#functionName").change(updateFunctionName);
        $("#functionVariable").change(updateFunctionName);

        $('#saveBTN').click(saveMonotoniLinje);        
    });
    function saveMonotoniLinje(){
        var canvas = document.getElementById('invisCanvas');
        var context = canvas.getContext('2d');

        const savePath = dialog.showSaveDialogSync({filters: [{ 
            name: 'Images', extensions: ['png']}],
            buttonLabel: "Gem", 
            title: "Gem monotonilinje",
            defaultPath: '~/Monotonilinje.png'
        });
        
        if(savePath != undefined){
            var data = canvas.toDataURL("img/png").replace(/^data:image\/\w+;base64,/, "");
            var buf = Buffer.from(data, 'base64');
            fs.writeFileSync(savePath, buf);
        }
    }
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



    function handleNulpunkter() {
        $("#nulpunkter").click(function () {
            $("#nulpunkterInput").focus();
        });

        $("#nulpunkterInput").keydown(function (e) {
            if (e.keyCode == 32) {
                var canvas = document.getElementById("invisCanvas");
                const context = canvas.getContext('2d');
                context.clearRect(0, 0, canvas.width, canvas.height);
                addNulpunkt();
                updateMonotoniLinje();
            } else if (e.keyCode == 8) {
                if(e.target.value.length == 1 || e.target.value.length == 0){
                    if (nulpunkter.length > 0) {
                        nulpunkter.pop().remove();
                    }
                    if(nulpunkter.length != 0){
                        var canvas = document.getElementById("invisCanvas");
                        const context = canvas.getContext('2d');
                        context.clearRect(0, 0, canvas.width, canvas.height);
                        updateMonotoniLinje();
                    }else{
                        $("#canvas").empty();
                    }
                }
            }
        });
    }

    // Updates the definition range for the function
    function updateDR() {
        var canvas = document.getElementById("invisCanvas");
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
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

    function addNulpunkt(Point = null) {
        if(Point == null){
            var point = parseFloat($("#nulpunkterInput").val());
        }else{
            var point = parseFloat(Point);
        }
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
    }

    function drawMonotoniLinje (ticks) {
        var svg = $("#canvas");
        var svgWidth = svg.attr("width");
        svg.empty();

        // Draw the line itself
        var arrowStart = svgWidth - 14;
        svg.append('<line x1="0" y1="50" x2="100%" y2="50" style="stroke:black; stroke-width:2" />');
        svg.append('<polygon points="' + arrowStart + ',45 ' + arrowStart + ',55 ' + (svgWidth - 2) + ',50" style="fill:black;" />')

        var totalSteps = ticks.length + 2;
        if (endCaps[0] != "infty") totalSteps += 1;
        if (endCaps[2] != "infty") totalSteps += 1;

        var step = svgWidth/totalSteps;
        var currentStep = 0;

        // Add variable names
        svg.append('<text class="italic" text-anchor="end" x="' + (step - 5) + '" y="40"  fill="black">' + functionVariable + '</text>');
        svg.append('<text class="italic" text-anchor="end" x="' + (step - 5) + '" y="70"  fill="black">' + functionName + ' \'(' + functionVariable + ')</text>');
        svg.append('<text class="italic" text-anchor="end" x="' + (step - 5) + '" y="100" fill="black">' + functionName + '(' + functionVariable + ')</text>');

        if (endCaps[0] != "infty") {
            currentStep = 3;
        } else {
            currentStep = 2;
        }

        // Add the first point
        for (var i = 0; i < ticks.length; i++) {
            var x = currentStep * step;
            var tick = ticks[i];
        
            if (tick[1] == 0) {
                // This point is a zeropoint

                // Draw the x value
                svg.append('<text text-anchor="middle" x="' + x + '" y="40" fill="black">' + tick[0] + '</text>');
                // Draw the actual tick
                svg.append('<line x1="' + x + '" y1="45" x2="' + x + '" y2="55" style="stroke:black; stroke-width:2" />');
                // Draw the derivative value
                svg.append('<text text-anchor="middle" x="' + x + '" y="70" fill="black">0</text>'); 
                
                // Draw whether it's a local minimum or maximum
                var type = i > 0 ? (ticks[i - 1][1] > 0 ? '+' : '-') : "/";
                type += i < ticks.length - 1 ? (ticks[i + 1][1] > 0 ? '+' : '-') : "/";

                if (type == "/-" || type == "+-" || type == "-/" || type == "-+")  {
                    svg.append('<text text-anchor="middle" x="' + x + '" y="100" fill="black">lok.</text>');
                }

                if (type == "/-" || type == "+-") {
                    svg.append('<text text-anchor="middle" x="' + x + '" y="113" fill="black">maks.</text>'); 
                } else if (type == "-/" || type == "-+") {
                    svg.append('<text text-anchor="middle" x="' + x + '" y="113" fill="black">min.</text>'); 
                }
            } else {
                // This point is not a zeropoint
                svg.append('<text text-anchor="middle" x="' + x + '" y="70" fill="black">' + (tick[1] > 0 ? "+" : "-") + '</text>');
                svg.append('<text text-anchor="middle" x="' + x + '" y="100" fill="black">' + (tick[1] > 0 ? "↗" : "↘") + '</text>'); 
            }

            // Increase the step, so that the next tick gets moved accordingly
            currentStep++;
        }

        // Draw the definition range
        drawDR(svg, step, svgWidth);
        svg.DOMRefresh();

        var svg = document.getElementById("canvas");
        var serializer = new XMLSerializer();
        var source = serializer.serializeToString(svg);
        if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
            source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
        var url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);

        var can = document.getElementById('invisCanvas');
        var ctx = can.getContext('2d');
        var img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 0, 0, 970, 135);
        }
        img.src = url;
    }

    function drawDR (svg, step, svgWidth) {
        var $dRl = $($("#dR .interval")[0]);

        if (!$dRl.hasClass("infty")) {
            svg.append('<line x1="' + step * 2 + '" y1="45" x2="' + step * 2 + '" y2="55" style="stroke:black; stroke-width:2" />');
            svg.append('<text text-anchor="middle" x="' + step * 2 + '" y="40" fill="black">' + $dRl.find("input").val() + '</text>');
            svg.append('<rect x="' + step + '" y="50" width="' + step + '" height="100%" fill="url(#diagonalHatch)"/>');
        
            if ($dRl.hasClass("open")) {
                svg.append('<line x1="' + step * 2 + '" x2="' + step * 2 + '" y1="50" y2="100%" stroke="black" stroke-width="2" stroke-linecap="round" stroke-dasharray="1, 6"/>');
            } else {
                svg.append('<line x1="' + step * 2 + '" x2="' + step * 2 + '" y1="50" y2="100%" stroke="black" stroke-width="2"/>');
            }
        }

        var $dRr = $($("#dR .interval")[1]);
        if (!$dRr.hasClass("infty")) {
            svg.append('<line x1="' + (svgWidth - step) + '" y1="45" x2="' + (svgWidth - step) + '" y2="55" style="stroke:black; stroke-width:2" />');
            svg.append('<text text-anchor="middle" x="' + (svgWidth - step) + '" y="40" fill="black">' + $dRr.find("input").val() + '</text>');
            svg.append('<rect x="' + (svgWidth - step) + '" y="50" width="' + step + '" height="100%" fill="url(#diagonalHatch)"/>');
        
            if ($dRr.hasClass("open")) {
                svg.append('<line x1="' + (svgWidth - step) + '" x2="' + (svgWidth - step) + '" y1="50" y2="100%" stroke="black" stroke-width="2" stroke-linecap="round" stroke-dasharray="1, 6"/>');
            } else {
                svg.append('<line x1="' + (svgWidth - step) + '" x2="' + (svgWidth - step) + '" y1="50" y2="100%" stroke="black" stroke-width="2"/>');
            }
        }

        svg.append('<pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="10" style="stroke:black; stroke-width:1" /></pattern>')
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