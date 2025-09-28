function fetchHello() {
    fetch('/ajax/hello/')
        .then(response => response.json())
        .then(data => {
            document.getElementById('ajax-message').innerText = data.message + ' (User: ' + data.user + ')';
        })
        .catch(error => {
            document.getElementById('ajax-message').innerText = 'Error: ' + error;
        });
}

// 1. AJAX POST: Save Data
function saveDataAJAX() {
    fetch('/ajax/save/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: 'Test Value' })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('ajax-save-message').innerText = 'Save status: ' + data.status + ', Saved: ' + data.saved;
    })
    .catch(error => {
        document.getElementById('ajax-save-message').innerText = 'Error: ' + error;
    });
}

// 2. AJAX: Return a List
function fetchListAJAX() {
    fetch('/ajax/list/')
        .then(response => response.json())
        .then(data => {
            let items = data.items.map(item => `<li>${item.name}</li>`).join('');
            document.getElementById('ajax-list').innerHTML = '<ul>' + items + '</ul>';
        })
        .catch(error => {
            document.getElementById('ajax-list').innerText = 'Error: ' + error;
        });
}

// 3. AJAX: Return HTML fragment
function fetchHtmlFragmentAJAX() {
    fetch('/ajax/html/')
        .then(response => response.json())
        .then(data => {
            document.getElementById('ajax-html-fragment').innerHTML = data.html;
        })
        .catch(error => {
            document.getElementById('ajax-html-fragment').innerText = 'Error: ' + error;
        });
}
