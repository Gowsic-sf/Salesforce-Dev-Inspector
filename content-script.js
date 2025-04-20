// Create inspector panel (combined for both flow and record detail pages)
function createInspectorPanel() {
    const panel = document.createElement('div');
    panel.id = 'sf-inspector-panel';
    panel.className = 'sf-inspector-panel collapsed';

    const isDarkMode = localStorage.getItem('sf-inspector-dark-mode') === 'true';
    if (isDarkMode) {
        panel.classList.add('dark-mode');
        document.body.classList.add('sf-dark-mode-applied');
    }

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'sf-inspector-toggle';
    toggleBtn.className = 'sf-inspector-toggle';
    toggleBtn.innerHTML = '⚙️ Dev Inspector';
    toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('collapsed');
    });

    const content = document.createElement('div');
    content.className = 'sf-inspector-content';
    content.innerHTML = `
      <div class="sf-header-actions">
        <button id="sf-dark-mode-toggle" class="sf-mode-toggle ${isDarkMode ? 'dark' : 'light'}">
          ${isDarkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
        <div id="sf-status-container" class="sf-status-container hidden">
          <p id="sf-status"></p>
        </div>
      </div>
      
      <div class="sf-tabs">
        <button id="sf-tab-info" class="sf-tab-btn active">Info</button>
        <button id="sf-tab-fields" class="sf-tab-btn">Fields</button>
        <button id="sf-tab-users" class="sf-tab-btn">Users</button>
        <button id="sf-tab-actions" class="sf-tab-btn">Actions</button>
      </div>
      
      <div id="sf-tab-content-info" class="sf-tab-content active">
        <div id="sf-info-container">
          <p id="sf-object-info">Detecting page type...</p>
        </div>
      </div>
      
      <div id="sf-tab-content-fields" class="sf-tab-content">
        <div class="sf-soql-container">
          <div class="sf-soql-header">
            <label for="sf-soql-query">SOQL Query</label>
            <button id="sf-copy-soql-btn" class="sf-field-copy-btn" title="Copy SOQL Query">📋</button>
          </div>
          <textarea id="sf-soql-query" class="sf-soql-query" readonly></textarea>
        </div>
        <div class="sf-search-container">
          <input type="text" id="sf-field-search" placeholder="Search fields...">
        </div>
        <div id="sf-fields-container" class="sf-fields-scrollable">
          <div class="sf-loading">Loading fields...</div>
        </div>
        <div id="sf-field-actions" class="sf-field-actions" style="display: none;">
          <button id="sf-save-fields-btn" class="sf-btn sf-btn-primary">Save</button>
          <button id="sf-cancel-fields-btn" class="sf-btn sf-btn-secondary">Cancel</button>
        </div>
      </div>
      
      <div id="sf-tab-content-users" class="sf-tab-content">
        <div class="sf-search-container">
          <input type="text" id="sf-user-search" placeholder="Search users by Id,Name,Profile,Username,Email,or Alias...">
        </div>
        <div id="sf-users-container" class="sf-users-scrollable">
          <div class="sf-loading">Loading users...</div>
        </div>
      </div>
      
      <div id="sf-tab-content-actions" class="sf-tab-content">
        <div id="sf-flow-actions" class="sf-actions-container hidden">
          <button id="sf-download-json-btn" class="sf-btn sf-btn-primary">Download Flow JSON</button>
          <button id="sf-copy-json-btn" class="sf-btn sf-btn-secondary">Copy Flow JSON</button>
        </div>
        <div id="sf-record-actions" class="sf-actions-container hidden">
          <button id="sf-copy-record-json-btn" class="sf-btn sf-btn-primary">Copy Record JSON</button>
          <button id="sf-download-record-json-btn" class="sf-btn sf-btn-secondary">Download Record JSON</button>
        </div>
      </div>
    `;

    panel.appendChild(toggleBtn);
    panel.appendChild(content);

    document.body.appendChild(panel);

    const darkModeToggle = content.querySelector('#sf-dark-mode-toggle');
    darkModeToggle.addEventListener('click', () => {
        const isDarkModeEnabled = panel.classList.toggle('dark-mode');
        if (isDarkModeEnabled) {
            darkModeToggle.textContent = '☀️ Light';
            darkModeToggle.classList.remove('light');
            darkModeToggle.classList.add('dark');
            document.body.classList.add('sf-dark-mode-applied');
        } else {
            darkModeToggle.textContent = '🌙 Dark';
            darkModeToggle.classList.remove('dark');
            darkModeToggle.classList.add('light');
            document.body.classList.remove('sf-dark-mode-applied');
        }
        localStorage.setItem('sf-inspector-dark-mode', isDarkModeEnabled);
    });

    const tabButtons = content.querySelectorAll('.sf-tab-btn');
    const tabContents = content.querySelectorAll('.sf-tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            const tabId = button.id.replace('sf-tab-', 'sf-tab-content-');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Initialize user search functionality
    const userSearch = content.querySelector('#sf-user-search');
    const usersContainer = content.querySelector('#sf-users-container');
    let allUsers = []; // Store users for filtering

    // Function to render users
    function renderUsers(users) {
        usersContainer.innerHTML = '';
        if (users.length === 0) {
            usersContainer.innerHTML = '<p>No users found.</p>';
            return;
        }
        users.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'sf-user-row';
            const userUrl = `https://${window.location.hostname}/lightning/r/User/${user.Id}/view`;
            const profileUrl = `https://${window.location.hostname}/lightning/r/Profile/${user.ProfileId}/view`;
            userElement.innerHTML = `
                <p><strong>ID:</strong> <a href="${userUrl}" target="_blank" rel="noopener noreferrer">${user.Id}</a></p>
                <p><strong>Name:</strong> ${user.Name || 'N/A'}</p>
                <p><strong>Username:</strong> ${user.Username || 'N/A'}</p>
                <p><strong>Profile:</strong> <a href="${profileUrl}" target="_blank" rel="noopener noreferrer">${user.Profile.Name}</a></p>
                <p><strong>Email:</strong> ${user.Email || 'N/A'}</p>
                <p><strong>Alias:</strong> ${user.Alias || 'N/A'}</p>
                <p><strong>Active:</strong> ${user.IsActive ? 'Yes' : 'No'}</p>
            `;
            usersContainer.appendChild(userElement);
        });
    }

    // Search functionality
    userSearch.addEventListener('input', () => {
        const searchTerm = userSearch.value.toLowerCase();
        const filteredUsers = allUsers.filter(user =>
            (user.Name?.toLowerCase() || '').includes(searchTerm) ||
            (user.Username?.toLowerCase() || '').includes(searchTerm) ||
            (user.Email?.toLowerCase() || '').includes(searchTerm) ||
            (user.Alias?.toLowerCase() || '').includes(searchTerm) ||
            (user.Profile.Name?.toLowerCase() || '').includes(searchTerm)||
            (user.Id?.toLowerCase() || '').includes(searchTerm)

        );
        renderUsers(filteredUsers);
    });

    return {
        panel,
        toggleBtn,
        infoContainer: content.querySelector('#sf-info-container'),
        objectInfo: content.querySelector('#sf-object-info'),
        fieldsContainer: content.querySelector('#sf-fields-container'),
        fieldSearch: content.querySelector('#sf-field-search'),
        soqlQuery: content.querySelector('#sf-soql-query'),
        copySoqlBtn: content.querySelector('#sf-copy-soql-btn'),
        flowActions: content.querySelector('#sf-flow-actions'),
        recordActions: content.querySelector('#sf-record-actions'),
        downloadFlowBtn: content.querySelector('#sf-download-json-btn'),
        copyFlowBtn: content.querySelector('#sf-copy-json-btn'),
        copyRecordBtn: content.querySelector('#sf-copy-record-json-btn'),
        downloadRecordBtn: content.querySelector('#sf-download-record-json-btn'),
        statusContainer: content.querySelector('#sf-status-container'),
        statusEl: content.querySelector('#sf-status'),
        darkModeToggle: content.querySelector('#sf-dark-mode-toggle'),
        saveFieldsBtn: content.querySelector('#sf-save-fields-btn'),
        cancelFieldsBtn: content.querySelector('#sf-cancel-fields-btn'),
        fieldActions: content.querySelector('#sf-field-actions'),
        usersContainer: content.querySelector('#sf-users-container'),
        userSearch: content.querySelector('#sf-user-search'),
        setUsers: (users) => {
            allUsers = users || [];
            renderUsers(allUsers);
        }
    };
}

// Add styles for Users tab
const style = document.createElement('style');
style.textContent = `
  .sf-field-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding: 10px;
    background-color: #fff;
    position: sticky;
    bottom: 0;
    z-index: 10;
    border-top: 1px solid #ddd;
  }
  .sf-inspector-panel.dark-mode .sf-field-actions {
    background-color: #333;
    border-top: 1px solid #555;
  }
  .sf-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .sf-btn-primary {
    background-color: #0066cc;
    color: white;
  }
  .sf-btn-secondary {
    background-color: #f4f4f4;
    color: #333;
  }
  .sf-inspector-panel.dark-mode .sf-btn-secondary {
    background-color: #555;
    color: #fff;
  }
  .sf-field-non-editable .sf-display-value {
    color: #888;
    cursor: not-allowed;
  }
  .sf-field-non-editable .sf-field-value {
    background-color: #f8f8f8;
  }
  .sf-inspector-panel.dark-mode .sf-field-non-editable .sf-field-value {
    background-color: #444;
  }
  .sf-input-error {
    border: 1px solid red !important;
    background-color: #ffe6e6;
  }
  .sf-tab-content {
    max-height: 70vh;
    overflow-y: auto;
  }
  .sf-fields-scrollable {
    max-height: calc(70vh - 200px);
    overflow-y: auto;
    padding-bottom: 10px;
  }
  .sf-users-scrollable {
    max-height: calc(70vh - 100px);
    overflow-y: auto;
    padding: 10px;
  }
  .sf-user-row {
    border-bottom: 1px solid #ddd;
    padding: 10px 0;
  }
  .sf-user-row p {
    margin: 5px 0;
  }
  .sf-search-container {
    padding: 10px;
  }
  .sf-search-container input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .sf-inspector-panel.dark-mode .sf-user-row {
    border-bottom: 1px solid #555;
  }
  .sf-inspector-panel.dark-mode .sf-search-container input {
    background-color: #444;
    border-color: #666;
    color: #fff;
  }
`;
document.head.appendChild(style);

// Show status message
function showStatus(elements, message, isSuccess = true) {
    elements.statusContainer.classList.remove('hidden');
    elements.statusContainer.classList.toggle('success', isSuccess);
    elements.statusContainer.classList.toggle('error', !isSuccess);

    elements.statusEl.textContent = message;
    elements.statusEl.classList.toggle('success', isSuccess);
    elements.statusEl.classList.toggle('error', !isSuccess);

    setTimeout(() => {
        elements.statusContainer.classList.add('hidden');
    }, 3000);
}

// Get Flow ID from URL
function getFlowIdFromUrl() {
    const url = new URL(window.location.href);
    return url.searchParams.get('flowId') || url.searchParams.get('flowDefId');
}

// Extract object info from Lightning URL
function getObjectInfoFromUrl() {
    try {
        const url = window.location.href;

        // Handle Lightning Experience URLs
        if (url.includes('/lightning/')) {
            // Pattern: /lightning/r/{objectName}/{recordId}/view
            const match = url.match(/\/lightning\/r\/([^\/]+)\/([^\/]+)\/view/);
            if (match && match.length >= 3) {
                let objectName = match[1];
                const recordId = match[2];

                // Remove namespace if present (e.g., MyNamespace__Object__c)
                if (objectName.includes('__')) {
                    objectName = objectName.split('__').pop() + '__c';
                }

                return { objectName, recordId, isRecordPage: true };
            }
        }

        // Handle Classic URLs
        if (url.includes('/lightning/r/') || url.includes('/setup/') || url.includes('/flow/')) {
            return { isRecordPage: false };
        }

        return { isRecordPage: false };
    } catch (error) {
        console.error('Error extracting object info:', error);
        return { isRecordPage: false };
    }
}

let editedFields = {};
let originalValues = {};

// Modified createFieldElement function
function createFieldElement(fieldName, label, value, type, editable) {
    const fieldRow = document.createElement('div');
    fieldRow.className = 'sf-field-row';
    fieldRow.dataset.fieldName = fieldName.toLowerCase();
    fieldRow.dataset.fieldLabel = label.toLowerCase();

    const labelWrapper = document.createElement('div');
    labelWrapper.className = 'sf-field-label-wrapper';

    const fieldLabel = document.createElement('div');
    fieldLabel.className = 'sf-field-label';
    fieldLabel.textContent = label;

    const fieldApi = document.createElement('div');
    fieldApi.className = 'sf-field-api';
    fieldApi.textContent = fieldName;

    labelWrapper.appendChild(fieldLabel);
    labelWrapper.appendChild(fieldApi);

    const fieldType = document.createElement('div');
    fieldType.className = 'sf-field-type';
    fieldType.textContent = type || '';

    const fieldValue = document.createElement('div');
    fieldValue.className = 'sf-field-value';

    const displayValue = document.createElement('div');
    displayValue.className = 'sf-display-value';
    displayValue.textContent = value ?? 'null';

    const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    input.className = 'sf-edit-input';
    input.style.display = 'none';
    input.value = value ?? '';
    input.disabled = !editable;

    // Set input type based on field type
    switch (type?.toLowerCase()) {
        case 'date':
            input.type = 'date';
            break;
        case 'datetime':
            input.type = 'datetime-local';
            break;
        case 'email':
            input.type = 'email';
            break;
        case 'phone':
            input.type = 'tel';
            break;
        case 'double':
        case 'currency':
        case 'percent':
        case 'number':
            input.type = 'number';
            input.step = type === 'double' || type === 'currency' ? '0.01' : '1';
            break;
        case 'boolean':
            input.type = 'checkbox';
            input.checked = value === true || value === 'true';
            break;
        case 'url':
            input.type = 'url';
            break;
        case 'textarea':
            input.rows = 4;
            break;
        default:
            input.type = 'text';
    }

    const copyBtn = document.createElement('button');
    copyBtn.className = 'sf-field-copy-btn';
    copyBtn.textContent = '📋';
    copyBtn.title = 'Copy value';
    copyBtn.addEventListener('click', () => {
        const textToCopy = displayValue.textContent;
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                copyBtn.textContent = '✓';
                setTimeout(() => { copyBtn.textContent = '📋'; }, 1000);
            });
    });

    if (editable) {
        displayValue.addEventListener('click', () => {
            input.value = formatInputValue(value, type);
            if (type === 'boolean') {
                input.checked = value === true || value === 'true';
            }
            displayValue.style.display = 'none';
            input.style.display = type === 'textarea' ? 'block' : 'inline-block';
            input.focus();
        });

        if (type === 'boolean') {
            input.addEventListener('change', () => {
                const newVal = input.checked;
                displayValue.textContent = newVal.toString();
                if (newVal !== (value ?? false)) {
                    editedFields[fieldName] = newVal;
                } else {
                    delete editedFields[fieldName];
                }
                updateFieldActionsVisibility();
            });
        } else {
            input.addEventListener('input', () => {
                const newVal = input.value;
                if (type === 'date' && newVal && !isValidDateFormat(newVal, type)) {
                    input.classList.add('sf-input-error');
                    input.title = `Invalid date format. Use YYYY-MM-DD`;
                    delete editedFields[fieldName];
                } else if (type === 'datetime' && newVal && !isValidDateFormat(newVal, type)) {
                    input.classList.add('sf-input-error');
                    input.title = `Invalid datetime format. Use YYYY-MM-DD HH:MM`;
                    delete editedFields[fieldName];
                } else if (type === 'email' && newVal && !isValidEmailFormat(newVal)) {
                    input.classList.add('sf-input-error');
                    input.title = `Invalid email format. Use a valid email address (e.g., user@domain.com)`;
                    delete editedFields[fieldName];
                } else if (type === 'phone' && newVal && !isValidPhoneFormat(newVal)) {
                    input.classList.add('sf-input-error');
                    input.title = `Invalid phone format. Use a valid phone number (e.g., +1234567890 or (123) 456-7890)`;
                    delete editedFields[fieldName];
                } else if (type === 'url' && newVal && !isValidUrlFormat(newVal)) {
                    input.classList.add('sf-input-error');
                    input.title = `Invalid URL format. Use a valid URL (e.g., https://example.com)`;
                    delete editedFields[fieldName];
                } else if (['double', 'currency', 'percent', 'number'].includes(type) && newVal && isNaN(newVal)) {
                    input.classList.add('sf-input-error');
                    input.title = `Invalid ${type} format. Use a valid number`;
                    delete editedFields[fieldName];
                } else {
                    input.classList.remove('sf-input-error');
                    input.title = '';
                    if (newVal !== (value ?? '')) {
                        editedFields[fieldName] = newVal;
                    } else {
                        delete editedFields[fieldName];
                    }
                }
                updateFieldActionsVisibility();
            });
        }

        if (type !== 'boolean') {
            input.addEventListener('blur', () => {
                const newVal = input.value;
                displayValue.textContent = newVal || 'null';
                input.style.display = 'none';
                displayValue.style.display = 'block';
            });
        }
    } else {
        fieldRow.classList.add('sf-field-non-editable');
        displayValue.title = 'This field is not editable due to permissions';
    }

    fieldValue.appendChild(displayValue);
    fieldValue.appendChild(input);

    const fieldHeader = document.createElement('div');
    fieldHeader.className = 'sf-field-header';
    fieldHeader.appendChild(labelWrapper);
    fieldHeader.appendChild(fieldType);
    fieldHeader.appendChild(copyBtn);

    fieldRow.appendChild(fieldHeader);
    fieldRow.appendChild(fieldValue);

    originalValues[fieldName] = value ?? '';

    return fieldRow;
}

// Helper function to validate phone numbers
function isValidPhoneFormat(phone) {
    const phoneRegex = /^\+?[\d\s()-]{7,15}$/;
    return phoneRegex.test(phone);
}

// Helper function to validate URLs
function isValidUrlFormat(url) {
    const urlRegex = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+\/?|localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?(\/[-a-zA-Z0-9@:%._\+~#=]*)*(\?[;&a-zA-Z0-9%._\+~#=-]*)?(#[a-zA-Z0-9_]*)?$/;
    return urlRegex.test(url);
}

// Helper function to validate date formats
function isValidDateFormat(value, type) {
    if (type === 'date') {
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
    } else if (type === 'datetime') {
        return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
    }
    return true;
}

// Helper function to validate email format
function isValidEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Helper function to format input value
function formatInputValue(value, type) {
    if (value == null) return '';
    if (type === 'datetime' && value) {
        return value.replace(' ', 'T').substring(0, 16);
    }
    return value.toString();
}

// Update visibility of save/cancel buttons
function updateFieldActionsVisibility() {
    const fieldActions = document.getElementById('sf-field-actions');
    if (Object.keys(editedFields).length > 0) {
        fieldActions.style.display = 'flex';
    } else {
        fieldActions.style.display = 'none';
    }
}

async function initializeRecordDetail(elements, objectInfo) {
    elements.objectInfo.innerHTML = `
      <p><strong>Object:</strong> ${objectInfo.objectName}</p>
      <p><strong>Record ID:</strong> ${objectInfo.recordId}</p>
    `;

    elements.recordActions.classList.remove('hidden');
    elements.flowActions.classList.add('hidden');

    elements.fieldSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const fieldRows = elements.fieldsContainer.querySelectorAll('.sf-field-row');
        fieldRows.forEach(row => {
            const fieldName = row.dataset.fieldName || '';
            const fieldLabel = row.dataset.fieldLabel || '';
            if (
                fieldName.includes(searchTerm) ||
                fieldLabel.includes(searchTerm)
            ) {
                row.style.display = 'block';
            } else {
                row.style.display = 'none';
            }
        });
    });

    elements.copySoqlBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(elements.soqlQuery.value)
            .then(() => {
                elements.copySoqlBtn.textContent = '✓';
                setTimeout(() => { elements.copySoqlBtn.textContent = '📋'; }, 1000);
                showStatus(elements, 'SOQL query copied to clipboard.');
            })
            .catch(err => {
                showStatus(elements, 'Failed to copy SOQL query.', false);
            });
    });

    elements.copyRecordBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({
            message: 'copyRecordData',
            objectName: objectInfo.objectName,
            recordId: objectInfo.recordId
        }, (response) => {
            if (response && response.success) {
                showStatus(elements, 'Record data copied to clipboard.');
            } else {
                showStatus(elements, response.error || 'Failed to copy record data.', false);
            }
        });
    });

    elements.downloadRecordBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({
            message: 'downloadRecordData',
            objectName: objectInfo.objectName,
            recordId: objectInfo.recordId
        }, (response) => {
            if (response && response.success) {
                showStatus(elements, 'Record data downloaded successfully.');
            } else {
                showStatus(elements, response.error || 'Failed to download record data.', false);
            }
        });
    });

    elements.saveFieldsBtn.addEventListener('click', () => {
        if (!objectInfo.recordId) {
            showStatus(elements, 'Error: Record ID is missing.', false);
            return;
        }
        if (!objectInfo.objectName) {
            showStatus(elements, 'Error: Object name is missing.', false);
            return;
        }
        if (Object.keys(editedFields).length === 0) {
            showStatus(elements, 'No fields have been edited.', false);
            return;
        }

        const invalidFields = Object.keys(editedFields).filter(fieldName => {
            const fieldData = elements.recordData[fieldName];
            if (fieldData && (fieldData.type === 'date' || fieldData.type === 'datetime')) {
                return !isValidDateFormat(editedFields[fieldName], fieldData.type);
            }
            return false;
        });

        if (invalidFields.length > 0) {
            showStatus(elements, `Invalid date format for fields: ${invalidFields.join(', ')}`, false);
            return;
        }

     
        chrome.runtime.sendMessage({
            message: 'updateRecordData',
            objectName: objectInfo.objectName,
            recordId: objectInfo.recordId,
            editedFields: editedFields
        }, (response) => {
            if (response && response.success) {
                showStatus(elements, 'Record updated successfully.');
                Object.keys(editedFields).forEach(fieldName => {
                    originalValues[fieldName] = editedFields[fieldName];
                });
                editedFields = {};
                updateFieldActionsVisibility();
                initializeRecordDetail(elements, objectInfo);
            } else {
                showStatus(elements, response.error || 'Failed to update record.', false);
            }
        });
    });

    elements.cancelFieldsBtn.addEventListener('click', () => {
        const fieldRows = elements.fieldsContainer.querySelectorAll('.sf-field-row');
        fieldRows.forEach(row => {
            const fieldName = row.dataset.fieldName;
            const displayValue = row.querySelector('.sf-display-value');
            const input = row.querySelector('.sf-edit-input');
            displayValue.textContent = originalValues[fieldName] ?? 'null';
            input.value = originalValues[fieldName] ?? '';
        });
        editedFields = {};
        updateFieldActionsVisibility();
    });

    chrome.runtime.sendMessage({
        message: 'getRecordData',
        objectName: objectInfo.objectName,
        recordId: objectInfo.recordId
    }, (response) => {
        if (response && response.success) {
            elements.fieldsContainer.innerHTML = '';
            const fields = Object.keys(response.recordData).sort();
            const soqlQuery = generateSoqlQuery(objectInfo.objectName, fields);
            elements.soqlQuery.value = soqlQuery;

            fields.forEach(fieldName => {
                const fieldData = response.recordData[fieldName];
                const fieldElement = createFieldElement(
                    fieldName,
                    fieldData.label,
                    fieldData.value,
                    fieldData.type,
                    fieldData.editable
                );
                elements.fieldsContainer.appendChild(fieldElement);
            });

            elements.objectInfo.innerHTML = '';
            let objectInfoHtml = `
                <p><strong>Object:</strong> ${objectInfo.objectName}</p>
                <p><strong>Rec ID:</strong> ${objectInfo.recordId}</p>
                <p><strong>Created Date:</strong> ${formatDateTime(response.recordData.CreatedDate?.value) || 'N/A'}</p>
                <p><strong>Created By:</strong> ${formatUserAlias(response.recordData.CreatedById?.value, response.users) || 'N/A'}</p>
                <p><strong>Last Modified Date:</strong> ${formatDateTime(response.recordData.LastModifiedDate?.value) || 'N/A'}</p>
                <p><strong>Last Modified By:</strong> ${formatUserAlias(response.recordData.LastModifiedById?.value, response.users) || 'N/A'}</p>
            `;

            const recordtypeData = response.recordTypeDatas?.recordTypeData;
            const layoutData = response.layoutData;
            if (recordtypeData) {
                const currentHost = window.location.hostname;
                const setupHost = currentHost
                    .replace('.lightning.force.com', '.my.salesforce-setup.com')
                    .replace('.my.salesforce.com', '.my.salesforce-setup.com');

                const recordTypeUrl = `https://${setupHost}/lightning/setup/ObjectManager/${objectInfo.objectName}/RecordTypes/${recordtypeData.id}/view`;

                // Construct the layout URL using the layout ID
                const layoutUrl = layoutData?.Id
                    ? `https://${setupHost}/lightning/setup/ObjectManager/${objectInfo.objectName}/PageLayouts/${layoutData.Id}/view`
                    : '#';

                objectInfoHtml += `
                    <p><strong>RT ID:</strong> 
                        <a href="${recordTypeUrl}" target="_blank" rel="noopener noreferrer">${recordtypeData.id}</a>
                    </p>
                    <p><strong>RT Name:</strong> 
                        <a href="${recordTypeUrl}" target="_blank" rel="noopener noreferrer">${recordtypeData.name}</a>
                    </p>
                    <p><strong>Layout Name:</strong> 
                        <a href="${layoutUrl}" target="_blank" rel="noopener noreferrer">${layoutData?.name || 'N/A'}</a>
                    </p>
                    <p><strong>RT Developer Name:</strong> 
                        <a href="${recordTypeUrl}" target="_blank" rel="noopener noreferrer">${recordtypeData.developerName}</a>
                    </p>
                `;
            }

            elements.objectInfo.innerHTML = objectInfoHtml;
            elements.recordData = response.recordData;

            // Set users in the Users tab
            elements.setUsers(response.users ? response.users.records : []);
        } else {
            elements.fieldsContainer.innerHTML = `
                <div class="sf-error">${response?.error || 'Failed to load record data.'}</div>
            `;
            elements.usersContainer.innerHTML = `
                <p class="sf-error">${response?.error || 'Failed to load users.'}</p>
            `;
        }
    });
}

function formatDateTime(dateString) {
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        }).format(date);
    } catch (e) {
        return null;
    }
}

function formatUserAlias(userData, users) {
    if (!userData || !users) return null;
    try {
        const userId = typeof userData === 'object' ? userData.Id : userData;
        if (!userId) return null;
        const user = users.records.find(u => u.Id === userId);
        if (!user || !user.Alias) return null;
        const currentHost = window.location.hostname;
        const userUrl = `https://${currentHost}/lightning/r/User/${user.Id}/view`;
        return `<a href="${userUrl}" target="_blank" rel="noopener noreferrer">${user.Alias}</a>`;
    } catch (e) {
        return null;
    }
}

function generateSoqlQuery(objectName, fields) {
    const fieldList = fields.join(', ');
    return `SELECT ${fieldList} FROM ${objectName}`;
}

async function initializeFlow(elements, flowId) {
    elements.objectInfo.innerHTML = '<p>Loading flow information...</p>';

    elements.flowActions.classList.remove('hidden');
    elements.recordActions.classList.add('hidden');

    // Ensure Users tab is visible
    document.getElementById('sf-tab-users')?.classList.remove('hidden');
    document.getElementById('sf-tab-content-users')?.classList.remove('hidden');

    elements.downloadFlowBtn.addEventListener('click', async () => {
        chrome.runtime.sendMessage({
            message: 'downloadFlowMetadata',
            flowId: flowId
        }, (response) => {
            if (response && response.success) {
                showStatus(elements, 'Flow metadata downloaded successfully.');
            } else {
                showStatus(elements, 'Failed to download flow metadata.', false);
            }
        });
    });

    elements.copyFlowBtn.addEventListener('click', async () => {
        chrome.runtime.sendMessage({
            message: 'copyFlowMetadata',
            flowId: flowId
        }, (response) => {
            if (response && response.success) {
                showStatus(elements, 'Flow metadata copied to clipboard.');
            } else {
                showStatus(elements, 'Failed to copy metadata to clipboard.', false);
            }
        });
    });

    chrome.runtime.sendMessage({
        message: 'getFlowInfo',
        flowId: flowId
    }, (response) => {
        if (response && response.success) {
            let flow = response.start;
            let Metadata = flow.Metadata;
            let start = Metadata.start;

            const fields = [
                { label: 'Flow Name', value: flow.MasterLabel },
                { label: 'Version', value: flow.VersionNumber },
                { label: 'Flow ID', value: flow.Id },
                { label: 'ApiVersion', value: flow.ApiVersion },
                { label: 'RecordTriggerType', value: start.recordTriggerType },
                { label: 'TriggerType', value: start.triggerType },
                { label: 'Triggering Object', value: start.object },
                { label: 'CreatedDate', value: formatDateTime(flow.CreatedDate) },
                { label: 'LastModifiedDate', value: formatDateTime(flow.LastModifiedDate) },
                { label: 'Created By', value: formatUserAlias(flow.CreatedById, response.users) || 'N/A' },
                { label: 'Last Modified By', value: formatUserAlias(flow.LastModifiedById, response.users) || 'N/A' }
            ];

            const validFields = fields.filter(field =>
                field.value !== null && field.value !== undefined && field.value !== ''
            );

            const infoHtml = validFields.map(field =>
                `<p><strong>${field.label}:</strong> ${field.value}</p>`
            ).join('');

            elements.objectInfo.innerHTML = infoHtml || '<p>No valid flow information available.</p>';

            // Set users in the Users tab
            if (response.users && response.users.records) {
                elements.setUsers(response.users.records);
            } else {
                elements.usersContainer.innerHTML = `
                    <p class="sf-error">Failed to load users.</p>
                `;
            }
        } else {
            elements.objectInfo.innerHTML = `
                <p class="sf-error">Managed flow can't be loaded</p>
            `;
            elements.usersContainer.innerHTML = `
                <p class="sf-error">${response?.error || 'Failed to load users.'}</p>
            `;
        }
    });
}

async function initializeInspector() {
    const elements = createInspectorPanel();

    const flowId = getFlowIdFromUrl();
    if (flowId) {
        document.getElementById('sf-tab-fields')?.classList.add('hidden');
        document.getElementById('sf-tab-content-fields')?.classList.add('hidden');
        await initializeFlow(elements, flowId);
        return;
    }

    const objectInfo = getObjectInfoFromUrl();
    if (objectInfo.isRecordPage) {
        await initializeRecordDetail(elements, objectInfo);
        return;
    }

    elements.objectInfo.innerHTML = `
      <p>Not on a supported page.</p>
      <p>Navigate to a Salesforce Flow or Record Detail page to use this extension.</p>
    `;
    elements.flowActions.classList.add('hidden');
    elements.recordActions.classList.add('hidden');
    elements.usersContainer.innerHTML = '<p>Not on a supported page.</p>';

    document.getElementById('sf-tab-fields')?.classList.add('hidden');
    document.getElementById('sf-tab-content-fields')?.classList.add('hidden');
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "copyToClipboard") {
        navigator.clipboard.writeText(request.content)
            .then(() => {
                console.log("Content copied to clipboard");
            })
            .catch(err => {
                console.error("Failed to copy content: ", err);
            });
    }
});

if (document.readyState === 'complete') {
    initializeInspector();
} else {
    window.addEventListener('load', initializeInspector);
}

const observer = new MutationObserver((mutations) => {
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== window.sfInspectorLastPath) {
        window.sfInspectorLastPath = currentPath;

        const existingPanel = document.getElementById('sf-inspector-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        initializeInspector();
    }
});

window.sfInspectorLastPath = window.location.pathname + window.location.search;
observer.observe(document, {
    childList: true,
    subtree: true
});