let editingIndex = null; // Variable to store the index of the expense being edited

// Check if a user is logged in. If not, redirect to login page
const loggedInUser = sessionStorage.getItem("loggedInUser");
if (!loggedInUser) {
    alert("You must log in first!");
    window.location.href = "index.html"; // Redirect to login page if not logged in
}

$(document).ready(function () {
    loadExpenses(); // Load the saved expenses when the page is loaded
    updateSummary(); // Update the summary of total expenses
    populateMonthDropdown(); // Populate the month dropdown for filtering

    // Add/Edit expense button click handler
    $('#addExpenseBtn').click(function () {
        const amount = parseFloat($('#expenseAmount').val()); // Get the expense amount
        const date = $('#expenseDate').val(); // Get the expense date
        const description = $('#expenseDescription').val(); // Get the expense description
        const type = $('#expenseType').val(); // Get the expense type (e.g., Food, Transport)

        // Validate inputs to ensure they are valid
        if (isNaN(amount) || amount <= 0 || !date || !description || !type) {
            alert("Please fill in all fields correctly! Make sure all the fields have values");
            return; // Exit early if validation fails
        }

        const expense = { // Create an expense object
            amount: amount,
            date: date,
            description: description,
            type: type
        };

        let expenses = getExpenses(); // Retrieve the list of expenses from localStorage

        if (editingIndex !== null) {
            expenses[editingIndex] = expense; // Update the existing expense if we're editing
        } else {
            expenses.push(expense); // Otherwise, add a new expense to the array
        }

        saveExpenses(expenses); // Save the updated expenses to localStorage
        resetForm(); // Reset the form fields
        loadExpenses(); // Reload the table with updated expenses
        updateSummary(); // Update the expense summary with the new total
    });

    // Function to load expenses and display them in the table
    function loadExpenses() {
        let expenses = getExpenses(); // Get the expenses from localStorage
        let expenseTableBody = $('#expenseTable tbody');
        expenseTableBody.empty(); // Clear any existing rows in the table

        // Check if expenses is an array, and render each expense in the table
        if (Array.isArray(expenses)) {
            expenses.forEach((expense, index) => {
                if (!isNaN(expense.amount) && expense.amount > 0) { // Ensure expense amount is valid
                    expenseTableBody.append(`
                        <tr>
                            <td>RM ${expense.amount.toFixed(2)}</td>
                            <td>${expense.date}</td>
                            <td>${expense.description}</td>
                            <td>${expense.type}</td>
                            <td>
                                <button class="btn btn-warning" onclick="editExpense(${index})">Edit</button>
                                <button class="btn btn-danger" onclick="confirmDelete(${index})">Delete</button>
                            </td>
                        </tr>
                    `);
                }
            });
        }
    }

    // Function to retrieve expenses from localStorage for the logged-in user
    function getExpenses() {
        const userExpenses = localStorage.getItem(loggedInUser); // Get the user's expenses from localStorage
        // If expenses exist, parse and return them, otherwise return an empty array
        if (userExpenses) {
            try {
                const expenses = JSON.parse(userExpenses);
                if (Array.isArray(expenses)) {
                    return expenses; // Return the parsed expenses array
                }
            } catch (e) {
                console.error("Error parsing expenses data", e); // Handle error if data is corrupted
            }
        }
        return []; // Return an empty array if no valid data is found
    }

    // Function to save expenses back into localStorage
    function saveExpenses(expenses) {
        localStorage.setItem(loggedInUser, JSON.stringify(expenses)); // Save expenses as a JSON string
    }

    // Function to update the total expenses summary
    function updateSummary() {
        let expenses = getExpenses(); // Get all expenses

        // Ensure expenses is an array before proceeding
        if (Array.isArray(expenses)) {
            let total = expenses.reduce((sum, expense) => sum + expense.amount, 0); // Calculate the total expenses
            $('#totalExpenses').text(`Total Expenses: RM ${total.toFixed(2) || '0.00'}`); // Update the displayed total
        } else {
            $('#totalExpenses').text("Total Expenses: RM 0"); // If no expenses, show 0
        }
    }

    // Function to populate the month dropdown dynamically with month names
    function populateMonthDropdown() {
        let monthSelect = $('#monthSelect');
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        // Loop through months and append them as options in the dropdown
        months.forEach((month, index) => {
            monthSelect.append(new Option(month, index + 1));
        });
    }

    // Update monthly summary based on selected month
    window.updateMonthlySummary = function () {
        const selectedMonth = $('#monthSelect').val(); // Get the selected month from the dropdown
        const expenses = getExpenses(); // Get all expenses

        // Ensure expenses is an array before filtering
        if (Array.isArray(expenses)) {
            let filteredExpenses = expenses.filter(expense => {
                const expenseDate = new Date(expense.date); // Convert expense date to Date object
                const expenseMonth = expenseDate.getMonth(); // Get the month of the expense
                const selectedMonthIndex = parseInt(selectedMonth) - 1; // Convert selected month to index
                return selectedMonth === "all" || expenseMonth === selectedMonthIndex; // Filter by month or show all
            });

            if (filteredExpenses.length === 0) {
                $('#noRecordsMessage').show(); // Show "no records" message if no expenses for selected month
                $('#expenseChart').hide(); // Hide the chart if there are no expenses
                $('#totalExpenses').text("Total Expenses: RM 0"); // Set total to 0
            } else {
                $('#noRecordsMessage').hide(); // Hide "no records" message if there are expenses
                $('#expenseChart').show(); // Show the chart

                const expenseData = filteredExpenses.reduce((acc, expense) => {
                    acc[expense.type] = (acc[expense.type] || 0) + expense.amount; // Group expenses by type
                    return acc;
                }, {});

                // Prepare data for the pie chart
                const chartData = {
                    labels: Object.keys(expenseData),
                    datasets: [{
                        label: 'Expense Breakdown',
                        data: Object.values(expenseData),
                        backgroundColor: ['#FF5733', '#33FF57', '#3357FF', '#FFD700'],
                        hoverOffset: 4
                    }]
                };

                // Render the pie chart
                const ctx = document.getElementById('expenseChart').getContext('2d');
                if (window.myPieChart) {
                    window.myPieChart.destroy(); // Destroy previous chart if it exists
                }
                window.myPieChart = new Chart(ctx, {
                    type: 'pie',
                    data: chartData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        aspectRatio: 1
                    }
                });

                // Update the total for filtered expenses
                let total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
                $('#totalExpenses').text(`Total Expenses: RM ${total.toFixed(2)}`);
            }
        }
    };

    // Logout function
    $('#logoutBtn').click(function () {
        sessionStorage.removeItem("loggedInUser"); // Remove the logged-in user from sessionStorage
        window.location.href = "index.html"; // Redirect to the login page
    });

    // Confirm delete function for a specific expense
    window.confirmDelete = function (index) {
        if (confirm("Are you sure you want to delete this expense?")) {
            deleteExpense(index); // Call deleteExpense if the user confirms
        }
    };

    // Function to delete an expense
    window.deleteExpense = function (index) {
        let expenses = getExpenses(); // Get the list of expenses
        expenses.splice(index, 1); // Remove the expense at the given index
        saveExpenses(expenses); // Save the updated expenses back to localStorage
        loadExpenses(); // Reload expenses to the table
        updateSummary(); // Update the total expense summary
    };

    // Function to edit an expense
    window.editExpense = function (index) {
        let expenses = getExpenses(); // Get the list of expenses
        const expense = expenses[index]; // Get the specific expense to edit

        // Pre-fill the form with the expense data
        $('#expenseAmount').val(expense.amount);
        $('#expenseDate').val(expense.date);
        $('#expenseDescription').val(expense.description);
        $('#expenseType').val(expense.type);

        editingIndex = index; // Set the editingIndex to the selected expense index
        $('#addExpenseBtn').text('Save Changes'); // Change the button text to "Save Changes"
    };

    // Clear all records function
    $('#clearAllRecordsBtn').click(function () {
        if (confirm("Are you sure you want to delete all records?")) {
            localStorage.removeItem(loggedInUser); // Remove all expenses from localStorage for the logged-in user
            loadExpenses(); // Reload expenses (will be empty)
            updateSummary(); // Update the summary (will show 0)
            alert('All records have been deleted!');
        }
    });

    // Function to reset the form and button
    function resetForm() {
        $('#expenseAmount').val(''); // Clear the amount field
        $('#expenseDate').val(''); // Clear the date field
        $('#expenseDescription').val(''); // Clear the description field
        $('#expenseType').val('Food'); // Reset the type to "Food"
        editingIndex = null; // Reset the editing index
        $('#addExpenseBtn').text('Add Expense'); // Reset button text to "Add Expense"
    }
});
