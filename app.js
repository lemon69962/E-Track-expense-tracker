let editingIndex = null;

// Check if a user is logged in using localStorage
const loggedInUser = localStorage.getItem("loggedInUser");
if (!loggedInUser) {
    alert("You must log in first!");
    window.location.href = "index.html"; // Redirect to login page
}

$(document).ready(function () {
    loadExpenses();  // Load expenses from localStorage
    updateSummary();  // Update the total expenses summary
    populateMonthDropdown();  // Populate the month dropdown for filtering

    // Add/Edit expense button click handler
    $('#addExpenseBtn').click(function () {
        const amount = parseFloat($('#expenseAmount').val());
        const date = $('#expenseDate').val();
        const description = $('#expenseDescription').val();
        const type = $('#expenseType').val();

        // Validate inputs
        if (isNaN(amount) || amount <= 0 || !date || !description || !type) {
            alert("Please fill in all fields correctly! Make sure all the fields have values");
            return; // Exit early if validation fails
        }

        const expense = {
            amount: amount,
            date: date,
            description: description,
            type: type
        };

        let expenses = getExpenses(); // Get expenses from localStorage

        if (editingIndex !== null) {
            expenses[editingIndex] = expense; // Update existing expense
        } else {
            expenses.push(expense); // Add new expense
        }

        saveExpenses(expenses);  // Save updated expenses to localStorage
        resetForm();  // Reset the form for new data
        loadExpenses();  // Reload the expense table
        updateSummary();  // Update the total summary
    });

    // Function to load expenses from localStorage and display in the table
    function loadExpenses() {
        let expenses = getExpenses();  // Get expenses from localStorage
        let expenseTableBody = $('#expenseTable tbody');
        expenseTableBody.empty();  // Clear existing rows

        // Ensure expenses is an array
        if (Array.isArray(expenses)) {
            expenses.forEach((expense, index) => {
                if (!isNaN(expense.amount) && expense.amount > 0) {
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

    // Function to get expenses from localStorage for the logged-in user
    function getExpenses() {
        const userExpenses = localStorage.getItem(loggedInUser);
        if (userExpenses) {
            try {
                const expenses = JSON.parse(userExpenses);
                if (Array.isArray(expenses)) {
                    return expenses;
                }
            } catch (e) {
                console.error("Error parsing expenses data", e);
            }
        }
        return []; // Return empty array if no data or invalid format
    }

    // Function to save expenses to localStorage
    function saveExpenses(expenses) {
        localStorage.setItem(loggedInUser, JSON.stringify(expenses));
    }

    // Function to update the expense summary (total expenses)
    function updateSummary() {
        let expenses = getExpenses();

        if (Array.isArray(expenses)) {
            let total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
            $('#totalExpenses').text(`Total Expenses: RM ${total.toFixed(2) || '0.00'}`);
        } else {
            $('#totalExpenses').text("Total Expenses: RM 0");
        }
    }

    // Populate the month dropdown dynamically
    function populateMonthDropdown() {
        let monthSelect = $('#monthSelect');
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        months.forEach((month, index) => {
            monthSelect.append(new Option(month, index + 1));
        });
    }

    // Update monthly summary
    window.updateMonthlySummary = function () {
        const selectedMonth = $('#monthSelect').val();
        const expenses = getExpenses();

        if (Array.isArray(expenses)) {
            let filteredExpenses = expenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                const expenseMonth = expenseDate.getMonth();
                const selectedMonthIndex = parseInt(selectedMonth) - 1;
                return selectedMonth === "all" || expenseMonth === selectedMonthIndex;
            });

            if (filteredExpenses.length === 0) {
                $('#noRecordsMessage').show();
                $('#expenseChart').hide();
                $('#totalExpenses').text("Total Expenses: RM 0");
            } else {
                $('#noRecordsMessage').hide();
                $('#expenseChart').show();

                const expenseData = filteredExpenses.reduce((acc, expense) => {
                    acc[expense.type] = (acc[expense.type] || 0) + expense.amount;
                    return acc;
                }, {});

                const chartData = {
                    labels: Object.keys(expenseData),
                    datasets: [{
                        label: 'Expense Breakdown',
                        data: Object.values(expenseData),
                        backgroundColor: ['#FF5733', '#33FF57', '#3357FF', '#FFD700'],
                        hoverOffset: 4
                    }]
                };

                const ctx = document.getElementById('expenseChart').getContext('2d');
                if (window.myPieChart) {
                    window.myPieChart.destroy();
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

                let total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
                $('#totalExpenses').text(`Total Expenses: RM ${total.toFixed(2)}`);
            }
        }
    };

    // Logout function
    $('#logoutBtn').click(function () {
        localStorage.removeItem("loggedInUser");  // Remove logged-in user from localStorage
        window.location.href = "index.html";  // Redirect to login page
    });

    // Confirm delete function
    window.confirmDelete = function (index) {
        if (confirm("Are you sure you want to delete this expense?")) {
            deleteExpense(index);
        }
    };

    // Delete expense function
    window.deleteExpense = function (index) {
        let expenses = getExpenses();
        expenses.splice(index, 1);  // Remove the expense from the array
        saveExpenses(expenses);  // Save updated expenses to localStorage
        loadExpenses();  // Reload the expenses table
        updateSummary();  // Update the summary
    };

    // Edit expense function
    window.editExpense = function (index) {
        let expenses = getExpenses();
        const expense = expenses[index];

        $('#expenseAmount').val(expense.amount);
        $('#expenseDate').val(expense.date);
        $('#expenseDescription').val(expense.description);
        $('#expenseType').val(expense.type);

        editingIndex = index;
        $('#addExpenseBtn').text('Save Changes');
    };

    // Clear all records function
    $('#clearAllRecordsBtn').click(function () {
        if (confirm("Are you sure you want to delete all records?")) {
            localStorage.removeItem(loggedInUser);  // Remove all expenses for the user
            loadExpenses();  // Reload the table
            updateSummary();  // Reset the summary
            alert('All records have been deleted!');
        }
    });

    // Function to reset the form and button
    function resetForm() {
        $('#expenseAmount').val('');
        $('#expenseDate').val('');
        $('#expenseDescription').val('');
        $('#expenseType').val('Food');
        editingIndex = null;
        $('#addExpenseBtn').text('Add Expense');
    }
});
