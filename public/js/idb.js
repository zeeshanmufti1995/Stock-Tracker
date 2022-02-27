// Create variable to hold db connection
let db;
// Establish a connection to IndexedDB database called 'budget' and set it to version 1
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function (event) {
    // Save a reference to the database 
    const db = event.target.result;
    // Create an object store (table) called `pending`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('pending', {
        autoIncrement: true
    });
};

request.onsuccess = function (event) {
    db = event.target.result;
    // Check if app online, if yes run checkDatabase();
    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = function (event) {
    console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a transaction and there's no internet connection
function saveRecord(record) {
    const transaction = db.transaction(['pending'], 'readwrite');
    const store = transaction.objectStore('pending');
    store.add(record);
}

// This function will be executed when online
function checkDatabase() {
    // open a transaction on your db
    const transaction = db.transaction(['pending'], 'readwrite');
    // access your object store
    const store = transaction.objectStore('pending');
    const getAll = store.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(() => {
                // open one more transaction
                const transaction = db.transaction(['pending'], 'readwrite');
                // access the pending object store
                const store = transaction.objectStore('pending');
                // clear all items in your store
                store.clear();
            })
            .catch(err => {
                console.log(err);
            });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', checkDatabase);