// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = themeToggle.querySelector('i');
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
});

// Data Management
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let userProfile = JSON.parse(localStorage.getItem('userProfile')) || {
    name: 'John Doe',
    email: 'john.doe@example.com',
    currency: 'INR',
    monthlySalary: 0,
    savingsGoal: 0,
    monthlyBudget: 0
};

// Currency symbols
const currencySymbols = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
};

// Initialize user profile in localStorage if not exists
if (!localStorage.getItem('userProfile')) {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
}

// Update UI with user profile data
function updateUserProfileUI() {
    document.getElementById('userName').value = userProfile.name;
    document.getElementById('userEmail').value = userProfile.email;
    document.getElementById('userCurrency').value = userProfile.currency;
    document.getElementById('monthlySalary').value = userProfile.monthlySalary;
    document.getElementById('savingsGoal').value = userProfile.savingsGoal;
    document.getElementById('monthlyBudget').value = userProfile.monthlyBudget;
}

// Function to show notification
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    if (isError) {
        notification.classList.add('error');
    } else {
        notification.classList.remove('error');
    }
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Format currency
function formatCurrency(amount) {
    const symbol = currencySymbols[userProfile.currency] || '₹';
    return symbol + amount.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
    });
}

// Calculate and update dashboard
function updateDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Today's spending
    const todaySpending = transactions
        .filter(t => t.date === today && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    document.getElementById('todaySpending').textContent = formatCurrency(todaySpending);

    // Monthly expenses
    const monthlyExpenses = transactions
        .filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth &&
                transactionDate.getFullYear() === currentYear &&
                t.type === 'expense';
        })
        .reduce((sum, t) => sum + t.amount, 0);

    document.getElementById('monthlyExpenses').textContent = formatCurrency(monthlyExpenses);

    // Budget status
    const budgetStatus = document.getElementById('budgetStatus');
    if (userProfile.monthlyBudget > 0) {
        const budgetPercentage = (monthlyExpenses / userProfile.monthlyBudget) * 100;
        budgetStatus.textContent = `${budgetPercentage.toFixed(1)}% of budget used`;

        if (budgetPercentage > 100) {
            budgetStatus.style.color = 'var(--danger)';
        } else if (budgetPercentage > 80) {
            budgetStatus.style.color = 'var(--warning)';
        } else {
            budgetStatus.style.color = 'var(--success)';
        }
    } else {
        budgetStatus.textContent = 'No budget set';
        budgetStatus.style.color = 'var(--gray)';
    }

    // Monthly income
    const monthlyIncome = transactions
        .filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth &&
                transactionDate.getFullYear() === currentYear &&
                t.type === 'income';
        })
        .reduce((sum, t) => sum + t.amount, 0);

    // Calculate savings
    const savings = monthlyIncome - monthlyExpenses;
    document.getElementById('savingsAmount').textContent = formatCurrency(savings);

    // Savings goal progress
    const savingsGoalText = document.getElementById('savingsGoalText');
    const savingsProgress = document.getElementById('savingsProgress');
    const savingsProgressBar = document.getElementById('savingsProgressBar');

    if (userProfile.savingsGoal > 0) {
        const progressPercentage = Math.min((savings / userProfile.savingsGoal) * 100, 100);
        savingsGoalText.textContent = `Goal: ${formatCurrency(userProfile.savingsGoal)}`;
        savingsProgress.textContent = `${Math.max(progressPercentage, 0).toFixed(1)}%`;
        savingsProgressBar.style.width = `${Math.max(progressPercentage, 0)}%`;

        // Color coding for savings progress
        if (progressPercentage >= 100) {
            savingsProgress.style.color = 'var(--success)';
            savingsProgressBar.style.background = 'var(--success)';
        } else if (progressPercentage >= 50) {
            savingsProgress.style.color = 'var(--warning)';
            savingsProgressBar.style.background = 'var(--warning)';
        } else {
            savingsProgress.style.color = 'var(--danger)';
            savingsProgressBar.style.background = 'var(--danger)';
        }
    } else {
        savingsGoalText.textContent = 'No savings goal set';
        savingsProgress.textContent = '0%';
        savingsProgressBar.style.width = '0%';
        savingsProgress.style.color = 'var(--gray)';
    }

    // Current balance
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const currentBalance = totalIncome - totalExpenses;
    document.getElementById('currentBalance').textContent = formatCurrency(currentBalance);

    // Update charts
    updateCharts();
}

// Update charts
function updateCharts() {
    // Category Chart (Pie)
    const categoryData = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
        });

    const categoryLabels = Object.keys(categoryData);
    const categoryValues = Object.values(categoryData);

    if (categoryChart) {
        categoryChart.data.labels = categoryLabels;
        categoryChart.data.datasets[0].data = categoryValues;
        categoryChart.update();
    }

    // Trend Chart (Line) - Last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days.push(date.toISOString().split('T')[0]);
    }

    const trendData = last7Days.map(date => {
        return transactions
            .filter(t => t.date === date && t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
    });

    if (trendChart) {
        trendChart.data.labels = last7Days.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        trendChart.data.datasets[0].data = trendData;
        trendChart.update();
    }

    // Comparison Chart (Bar) - Last 6 months
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        months.push({
            year: date.getFullYear(),
            month: date.getMonth(),
            label: `${monthNames[date.getMonth()]} ${date.getFullYear()}`
        });
    }

    const comparisonData = months.map(m => {
        return transactions
            .filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getFullYear() === m.year &&
                    transactionDate.getMonth() === m.month &&
                    t.type === 'expense';
            })
            .reduce((sum, t) => sum + t.amount, 0);
    });

    if (comparisonChart) {
        comparisonChart.data.labels = months.map(m => m.label);
        comparisonChart.data.datasets[0].data = comparisonData;
        comparisonChart.update();
    }
}

// Render transactions list
function renderTransactions() {
    const transactionsList = document.getElementById('transactionsList');

    if (transactions.length === 0) {
        transactionsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-receipt"></i>
                        <h3>No transactions yet</h3>
                        <p>Add your first transaction to get started</p>
                    </div>
                `;
        return;
    }

    transactionsList.innerHTML = '';

    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedTransactions.forEach(transaction => {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        transactionItem.dataset.id = transaction.id;

        const categoryColors = {
            food: '#f72585',
            shopping: '#4361ee',
            transport: '#4cc9f0',
            entertainment: '#f8961e',
            bills: '#7209b7',
            health: '#06d6a0',
            other: '#6b7280'
        };

        const categoryIcons = {
            food: 'fas fa-utensils',
            shopping: 'fas fa-shopping-bag',
            transport: 'fas fa-car',
            entertainment: 'fas fa-film',
            bills: 'fas fa-file-invoice',
            health: 'fas fa-heartbeat',
            other: 'fas fa-receipt'
        };

        const amountClass = transaction.type === 'income' ? 'income' : 'expense';
        const amountSign = transaction.type === 'income' ? '+' : '-';

        transactionItem.innerHTML = `
                    <div class="transaction-info">
                        <div class="transaction-icon" style="background-color: ${categoryColors[transaction.category] || '#6b7280'}">
                            <i class="${categoryIcons[transaction.category] || 'fas fa-receipt'}"></i>
                        </div>
                        <div class="transaction-details">
                            <h4>${transaction.title}</h4>
                            <p>${transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)} - ${new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                    </div>
                    <div class="transaction-amount ${amountClass}">${amountSign} ${formatCurrency(transaction.amount)}</div>
                    <div class="transaction-actions">
                        <button class="edit-transaction" data-id="${transaction.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-transaction" data-id="${transaction.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;

        transactionsList.appendChild(transactionItem);
    });

    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-transaction').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            editTransaction(id);
        });
    });

    document.querySelectorAll('.delete-transaction').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            showDeleteConfirmation(id);
        });
    });
}

// Edit transaction
function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    document.getElementById('editId').value = transaction.id;
    document.getElementById('editTransactionType').value = transaction.type;
    document.getElementById('editTitle').value = transaction.title;
    document.getElementById('editAmount').value = transaction.amount;
    document.getElementById('editCategory').value = transaction.category;
    document.getElementById('editDate').value = transaction.date;
    document.getElementById('editNotes').value = transaction.notes || '';

    openModal(editModal);
}

// Show delete confirmation
function showDeleteConfirmation(id) {
    const deleteConfirmation = document.getElementById('deleteConfirmation');
    deleteConfirmation.classList.add('show');

    document.getElementById('confirmDelete').onclick = () => {
        deleteTransaction(id);
        deleteConfirmation.classList.remove('show');
    };

    document.getElementById('cancelDelete').onclick = () => {
        deleteConfirmation.classList.remove('show');
    };
}

// Delete transaction
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    renderTransactions();
    updateDashboard();
    showNotification('Transaction deleted successfully');
}

// Modal Functionality
const addExpenseBtn = document.getElementById('addExpenseBtn');
const addTransactionBtn = document.getElementById('addTransactionBtn');
const expenseModal = document.getElementById('expenseModal');
const editModal = document.getElementById('editModal');
const closeModal = document.getElementById('closeModal');
const closeEditModal = document.getElementById('closeEditModal');
const expenseForm = document.getElementById('expenseForm');
const editForm = document.getElementById('editForm');
const deleteTransactionBtn = document.getElementById('deleteTransaction');
const userProfileBtn = document.getElementById('userProfile');
const userModal = document.getElementById('userModal');
const closeUserModal = document.getElementById('closeUserModal');
const userForm = document.getElementById('userForm');

// Function to open modal
function openModal(modal) {
    modal.classList.add('show');
    modal.style.display = 'flex';
}

// Function to close modal
function closeModalFunc(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 400);
}

// Open expense modal
addExpenseBtn.addEventListener('click', () => openModal(expenseModal));
addTransactionBtn.addEventListener('click', () => openModal(expenseModal));

// Close expense modal
closeModal.addEventListener('click', () => closeModalFunc(expenseModal));

// Close edit modal
closeEditModal.addEventListener('click', () => closeModalFunc(editModal));

// Open user modal
userProfileBtn.addEventListener('click', () => {
    updateUserProfileUI();
    openModal(userModal);
});

// Close user modal
closeUserModal.addEventListener('click', () => closeModalFunc(userModal));

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === expenseModal) closeModalFunc(expenseModal);
    if (e.target === editModal) closeModalFunc(editModal);
    if (e.target === userModal) closeModalFunc(userModal);
});

// Handle expense form submission
expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('expenseTitle').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;
    const date = document.getElementById('expenseDate').value;
    const type = document.getElementById('transactionType').value;
    const notes = document.getElementById('expenseNotes').value;

    // Validate inputs
    if (!title || !amount || !category || !date) {
        showNotification('Please fill all required fields', true);
        return;
    }

    // Create transaction object
    const transaction = {
        id: Date.now().toString(),
        title,
        amount,
        category,
        date,
        type,
        notes,
        createdAt: new Date().toISOString()
    };

    // Add to transactions array
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    // Update UI
    renderTransactions();
    updateDashboard();

    // Show success message
    showNotification(`${type === 'expense' ? 'Expense' : 'Income'} added successfully!`);

    // Close modal and reset form
    closeModalFunc(expenseModal);
    expenseForm.reset();
    document.getElementById('expenseDate').valueAsDate = new Date();
});

// Handle edit form submission
editForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const title = document.getElementById('editTitle').value;
    const amount = parseFloat(document.getElementById('editAmount').value);
    const category = document.getElementById('editCategory').value;
    const date = document.getElementById('editDate').value;
    const type = document.getElementById('editTransactionType').value;
    const notes = document.getElementById('editNotes').value;

    // Validate inputs
    if (!title || !amount || !category || !date) {
        showNotification('Please fill all required fields', true);
        return;
    }

    // Update transaction
    const transactionIndex = transactions.findIndex(t => t.id === id);
    if (transactionIndex !== -1) {
        transactions[transactionIndex] = {
            ...transactions[transactionIndex],
            title,
            amount,
            category,
            date,
            type,
            notes
        };

        localStorage.setItem('transactions', JSON.stringify(transactions));

        // Update UI
        renderTransactions();
        updateDashboard();

        // Show success message
        showNotification('Transaction updated successfully!');

        // Close modal
        closeModalFunc(editModal);
    }
});

// Handle delete transaction from edit modal
deleteTransactionBtn.addEventListener('click', () => {
    const id = document.getElementById('editId').value;
    showDeleteConfirmation(id);
});

// Handle user form submission
userForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const oldSalary = userProfile.monthlySalary;

    userProfile.name = document.getElementById('userName').value;
    userProfile.email = document.getElementById('userEmail').value;
    userProfile.currency = document.getElementById('userCurrency').value;
    userProfile.monthlySalary = parseFloat(document.getElementById('monthlySalary').value) || 0;
    userProfile.savingsGoal = parseFloat(document.getElementById('savingsGoal').value) || 0;
    userProfile.monthlyBudget = parseFloat(document.getElementById('monthlyBudget').value) || 0;

    localStorage.setItem('userProfile', JSON.stringify(userProfile));

    // If salary changed, create a salary transaction
    if (userProfile.monthlySalary > 0 && userProfile.monthlySalary !== oldSalary) {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Check if there's already a salary transaction for this month
        const existingSalary = transactions.find(t =>
            t.title === 'Salary' &&
            t.type === 'income' &&
            new Date(t.date).getMonth() === currentMonth &&
            new Date(t.date).getFullYear() === currentYear
        );

        if (existingSalary) {
            // Update existing salary transaction
            existingSalary.amount = userProfile.monthlySalary;
        } else {
            // Create new salary transaction
            const salaryTransaction = {
                id: Date.now().toString(),
                title: 'Salary',
                amount: userProfile.monthlySalary,
                category: 'other',
                date: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
                type: 'income',
                notes: 'Monthly salary',
                createdAt: new Date().toISOString()
            };

            transactions.push(salaryTransaction);
        }

        localStorage.setItem('transactions', JSON.stringify(transactions));
        renderTransactions();
    }

    updateDashboard();
    showNotification('Profile and goals updated successfully!');
    closeModalFunc(userModal);
});

// Set today's date as default for the date input
document.getElementById('expenseDate').valueAsDate = new Date();

// Initialize charts
let categoryChart, trendChart, comparisonChart;

function initializeCharts() {
    // Category Chart (Pie)
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#f72585',
                    '#4361ee',
                    '#4cc9f0',
                    '#f8961e',
                    '#7209b7',
                    '#06d6a0',
                    '#6b7280'
                ],
                borderWidth: 0,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                }
            },
            cutout: '65%'
        }
    });

    // Trend Chart (Line)
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Daily Spending',
                data: [],
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#4361ee',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // Comparison Chart (Bar)
    const comparisonCtx = document.getElementById('comparisonChart').getContext('2d');
    comparisonChart = new Chart(comparisonCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Monthly Spending',
                data: [],
                backgroundColor: '#4cc9f0',
                borderWidth: 0,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Initialize the app
function init() {
    initializeCharts();
    updateUserProfileUI();
    renderTransactions();
    updateDashboard();
}

// Start the app
init();