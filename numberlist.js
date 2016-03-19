$(document).ready(function () {
    handleNumberLists();

    function handleNumberLists() {
        $(".number-list-input").each(function (i, e) {
            // Initialize an arary used to contain the elements for the numbers in the list
            $(e).data('_elements', []);
            // An array containing just the numbers in the list
            $(e).data('value', []);
        });

        $(".number-list-input").click(function (e) {
            $(e.target).find("input").focus();
        });

        $(".number-list-input input").keydown(function (e) {
            var numberList = $(e.target).parent();

            if (e.keyCode == 32) {
                // Space - try to add a new number
                addNumber(numberList);

                // Dispatch change event
                var changeEvent = new Event('change');
                numberList[0].dispatchEvent(changeEvent);
            } else if (e.keyCode == 8) {
                // Backspace - try to remove a number
                var numbers = numberList.data('_elements');
                if (numbers.length > 0) {
                    numbers.pop().remove();
                    numberList.data('value').pop();
                }

                // Dispatch change event
                var changeEvent = new Event('change');
                numberList[0].dispatchEvent(changeEvent);
            }
        });
    }

    function addNumber(numberList) {
        var input = numberList.find("input");
        var numberElements = numberList.data('_elements');
        var numbers = numberList.data('value');

        var number = parseFloat(input.val());
        input.val("");
        if (isNaN(number)) {
            return; // Drop the number, it isn't interesting
        }

        var numberElement = $('<span class="label label-default">' + number + '</span>');
        numberElement.data("value", number);

        var inserted = false;
        // Insert the number back into the array
        for (var i = 0; i < numbers.length; i++) {
            if (number == numbers[i]) {
                return; // Don't add the number twice
            } else if (number < numbers[i]) {
                numberElements[i].before(numberElement);
                numberElements.splice(i, 0, numberElement);
                numbers.splice(i, 0, number);
                inserted = true;
                break;
            }
        }

        if (! inserted) {
            numberElements.push(numberElement);
            numbers.push(number);
            numberList.find(".number-list-container").append(numberElement);
        }
    }
});