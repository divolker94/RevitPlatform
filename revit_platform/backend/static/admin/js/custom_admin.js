document.addEventListener('DOMContentLoaded', function() {
    // Подсветка строк таблицы в зависимости от типа пользователя
    const userRows = document.querySelectorAll('tr[class*="row"]');
    userRows.forEach(row => {
        const userTypeCell = row.querySelector('td.field-user_type');
        if (userTypeCell) {
            const userType = userTypeCell.textContent.trim().toLowerCase();
            row.classList.add(userType);
        }
    });
}); 