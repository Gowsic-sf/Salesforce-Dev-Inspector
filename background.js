// Handle messages from content scripts and the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle session request from popup
  if (request.message === "getSession") {
    handleGetSession(request, sender, sendResponse);
    return true;
  }

  // Handle flow info request from content script
  else if (request.message === "getFlowInfo") {
    handleFlowInfo(request, sender, sendResponse);
    return true;
  }

  // Handle download request from content script
  else if (request.message === "downloadFlowMetadata") {
    handleDownloadFlow(request, sender, sendResponse);
    return true;
  }

  // Handle copy to clipboard request from content script
  else if (request.message === "copyFlowMetadata") {
    handleCopyFlowMetadata(request, sender, sendResponse);
    return true;
  }

  // Handle get record data request from content script
  else if (request.message === "getRecordData") {
    handleGetRecordData(request, sender, sendResponse);
    return true;
  }

  // Handle copy record data request from content script
  else if (request.message === "copyRecordData") {
    handleCopyRecordData(request, sender, sendResponse);
    return true;
  }

  // Handle download record data request from content script
  else if (request.message === "downloadRecordData") {
    handleDownloadRecordData(request, sender, sendResponse);
    return true;
  }

  //Handle Update Record
  else if (request.message === "updateRecordData") {
    handleUpdateRecordData(request, sender, sendResponse);
    return true; // Keep the message channel open for async response
  }
});

// Handle get session request
function handleGetSession(request, sender, sendResponse) {
  chrome.cookies.get(
    {
      url: "https://" + request.sfHost,
      name: "sid",
      storeId: sender.tab?.cookieStoreId,
    },
    (sessionCookie) => {
      if (!sessionCookie) {
        sendResponse({ success: false, error: "Session cookie not found" });
        return;
      }

      sendResponse({
        success: true,
        session: {
          key: sessionCookie.value,
          hostName: sessionCookie.domain,
        }
      });
    }
  );
}

// Get flow info from the API
async function handleFlowInfo(request, sender, sendResponse) {
  try {
    const tabUrl = sender.tab.url;
    const url = new URL(tabUrl);
    let hostName;

    // Extract Salesforce domain
    if (url.hostname.includes(".lightning.force.com")) {
      hostName = url.hostname.replace(".lightning.force.com", ".my.salesforce.com");
    } else if (url.hostname.includes(".salesforce.com")) {
      hostName = url.hostname;
    } else {
      throw new Error("Not a Salesforce domain");
    }

    // Get session
    const sessionResponse = await getSessionInfo(hostName);
    if (!sessionResponse.success) {
      throw new Error("Failed to get session info");
    }

    const flowId = request.flowId;
    const sid = sessionResponse.session.key;
    const host = `https://${hostName}`;
    const apiVersion = "v60.0";

    // Get flow info
    const flow = await fetchFlow(host, apiVersion, sid, flowId);
    let starts = flow.start;

    // Get user data
    let users;
    try {
      users = await getAllUsers(host, apiVersion, sid);
    } catch (userError) {
      console.error("Error fetching users:", userError);
      // Continue with flow data even if user fetch fails
      users = { records: [] };
    }

    // Send response with flow and user data
    sendResponse({
      start: flow,
      success: true,
      flowName: flow.label || flow.MasterLabel || flow.FullName || "Unknown",
      flowVersion: flow.apiVersion,
      flowId: flowId,
      lastModifiedDate: flow.lastModifiedDate || flow.LastModifiedDate || "Unknown",
      users: users
    });
  } catch (error) {
    console.error("Error handling flow info:", error);
    sendResponse({
      success: false,
      error: error.message || "Failed to get flow information",
      stack: error.stack,
      users: { records: [] } // Include empty users array on error
    });
  }
}

async function handleDownloadFlow(request, sender, sendResponse) {
  try {
    const tabUrl = sender.tab.url;
    const url = new URL(tabUrl);
    let hostName;

    if (url.hostname.includes(".lightning.force.com")) {
      hostName = url.hostname.replace(".lightning.force.com", ".my.salesforce.com");
    } else if (url.hostname.includes(".salesforce.com")) {
      hostName = url.hostname;
    } else {
      throw new Error("Not a Salesforce domain");
    }

    const sessionResponse = await getSessionInfo(hostName);
    if (!sessionResponse.success) {
      throw new Error("Failed to get session info");
    }

    const flowId = request.flowId;
    const sid = sessionResponse.session.key;
    const host = `https://${hostName}`;
    const apiVersion = "v58.0";

    const flow = await fetchFlow(host, apiVersion, sid, flowId);

    const flowName = flow.FullName || flow.DeveloperName || "unknown-flow";
    const fileName = `${flowName}_v${flowId}.json`;

    const content = JSON.stringify(flow.Metadata, null, 2);

    // ✅ Use data URL instead of Blob
    const base64Data = btoa(unescape(encodeURIComponent(content)));
    const dataUrl = `data:application/json;base64,${base64Data}`;

    chrome.downloads.download({
      url: dataUrl,
      filename: fileName,
      saveAs: true
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error("Error handling download flow:", error);
    sendResponse({
      success: false,
      error: error.message || "Failed to download flow metadata"
    });
  }
}

// Handle copy flow metadata request
async function handleCopyFlowMetadata(request, sender, sendResponse) {
  try {
    const tabUrl = sender.tab.url;
    const url = new URL(tabUrl);
    let hostName;

    // Extract Salesforce domain
    if (url.hostname.includes(".lightning.force.com")) {
      hostName = url.hostname.replace(".lightning.force.com", ".my.salesforce.com");
    } else if (url.hostname.includes(".salesforce.com")) {
      hostName = url.hostname;
    } else {
      throw new Error("Not a Salesforce domain");
    }

    // Get session
    const sessionResponse = await getSessionInfo(hostName);
    if (!sessionResponse.success) {
      throw new Error("Failed to get session info");
    }

    const flowId = request.flowId;
    const sid = sessionResponse.session.key;
    const host = `https://${hostName}`;
    const apiVersion = "v58.0";

    // Get flow
    const flow = await fetchFlow(host, apiVersion, sid, flowId);

    // Copy to clipboard via content script
    chrome.tabs.sendMessage(sender.tab.id, {
      message: "copyToClipboard",
      content: JSON.stringify(flow.Metadata, null, 2)
    });

    sendResponse({
      success: true
    });
  } catch (error) {
    console.error("Error handling copy flow metadata:", error);
    sendResponse({
      success: false,
      error: error.message || "Failed to copy flow metadata"
    });
  }
}

// Handle get record data request
async function handleGetRecordData(request, sender, sendResponse) {
  try {
    const tabUrl = sender.tab.url;
    const url = new URL(tabUrl);
    let hostName;

    // Extract Salesforce domain
    if (url.hostname.includes(".lightning.force.com")) {
      hostName = url.hostname.replace(".lightning.force.com", ".my.salesforce.com");
    } else if (url.hostname.includes(".salesforce.com")) {
      hostName = url.hostname;
    } else {
      throw new Error("Not a Salesforce domain");
    }

    // Get session
    const sessionResponse = await getSessionInfo(hostName);
    if (!sessionResponse.success) {
      throw new Error("Failed to get session info");
    }

    const objectName = request.objectName;
    const recordId = request.recordId;
    const sid = sessionResponse.session.key;
    const host = `https://${hostName}`;
    const apiVersion = "v58.0";
    let objectDescribes;

    // If objectName is not provided, try to determine it from record ID
    let actualObjectName = objectName;
    if (!actualObjectName) {
      try {
        const prefix = recordId.substring(0, 3);
        const globalDescribeUrl = `${host}/services/data/${apiVersion}/sobjects/`;
        const globalDescribeResponse = await fetch(globalDescribeUrl, {
          headers: {
            "Authorization": `Bearer ${sid}`,
            "Content-Type": "application/json"
          }
        });

        if (globalDescribeResponse.ok) {
          const globalDescribe = await globalDescribeResponse.json();
          for (const obj of globalDescribe.sobjects) {
            if (obj.keyPrefix === prefix) {
              actualObjectName = obj.name;
              break;
            }
          }
        }
      } catch (error) {
        console.warn("Failed to determine object type from prefix:", error);
      }
    }

    // Get record data
    const recordData = await getRecord(host, apiVersion, sid, recordId, actualObjectName);

    // If we still don't have an object name but the record data has it in attributes
    if (!actualObjectName && recordData && recordData.attributes && recordData.attributes.type) {
      actualObjectName = recordData.attributes.type;
    }

    // Get object metadata to get field information if we have an object name
    let fieldMap = {};
    if (actualObjectName) {
      try {
        const objectDescribe = await getObjectDescribe(host, apiVersion, sid, actualObjectName);
        objectDescribes = objectDescribe;
        // Create a field map with labels and permissions
        objectDescribe.fields.forEach(field => {
          fieldMap[field.name] = {
            label: field.label,
            type: field.type,
            value: null,
            editable: field.updateable
          };
        });
      } catch (describeError) {
        console.warn("Could not get object describe info:", describeError);
      }
    }

    // Ensure recordData is an object before processing
    if (typeof recordData !== 'object' || recordData === null) {
      throw new Error("Record data is not a valid object");
    }

    // Map the record data to the field information
    const fieldsData = {};
    for (const [key, value] of Object.entries(recordData)) {
      if (key !== 'attributes') {
        const fieldInfo = fieldMap[key] || { label: key, type: typeof value, editable: false };
        fieldsData[key] = {
          label: fieldInfo.label || key,
          type: fieldInfo.type || typeof value,
          value: value,
          editable: fieldInfo.editable
        };
      }
    }

    // Add RecordType Name and DeveloperName to fieldsData
    const recordTypeId = fieldsData.RecordTypeId;
    let rid = recordTypeId?.value;
    const recordTypeData = {};
    if (recordTypeId && objectDescribes && Array.isArray(objectDescribes.recordTypeInfos)) {
      const rtInfo = objectDescribes.recordTypeInfos.find(rt => rt.recordTypeId === rid);
      if (rtInfo) {
        recordTypeData['recordTypeData'] = {
          id: rid,
          name: rtInfo.name,
          developerName: rtInfo.developerName
        };
      }
    }

    // Get users and profiles
    const users = await getAllUsers(host, apiVersion, sid);
    const profileMap = await getAllProfiles(host, apiVersion, sid);

    // Get current user's ID if not provided in session
    let profileId;
    if (!sessionResponse.session.userId) {
      try {
        const userInfoUrl = `${host}/services/data/${apiVersion}/chatter/users/me`;
        const userInfoResponse = await fetch(userInfoUrl, {
          headers: {
            "Authorization": `Bearer ${sid}`,
            "Content-Type": "application/json"
          }
        });

        if (userInfoResponse.ok) {
          const userInfo = await userInfoResponse.json();
          sessionResponse.session.userId = userInfo.id; // Store userId for future use
        } else {
          console.warn("Failed to fetch current user info:", userInfoResponse.statusText);
        }
      } catch (userInfoError) {
        console.warn("Error fetching current user info:", userInfoError);
      }
    }

    // Get current user's profile ID from users data
    const currentUser = users.records.find(user => user.Id === sessionResponse.session.userId);
    profileId = currentUser?.ProfileId;

    // Get layout information
    let layoutData = null;
    if (rid && profileId) {
      try {
        // Query the ProfileLayout object via REST API to get layout associated with the user's profile
        const layoutQuery = encodeURIComponent(
          `SELECT Layout.Name,Layout.Id FROM ProfileLayout WHERE ProfileId = '${profileId}' AND RecordTypeId = '${rid}'`
        );

        const layoutQueryUrl = `${host}/services/data/v51.0/tooling/query?q=${layoutQuery}`;
        const layoutResponse = await fetch(layoutQueryUrl, {
          headers: {
            "Authorization": `Bearer ${sid}`,
            "Content-Type": "application/json"
          }
        });

        if (layoutResponse.ok) {
          const layoutResult = await layoutResponse.json();
          if (layoutResult.records && layoutResult.records.length > 0) {
            const profileLayout = layoutResult.records[0];
            layoutData = {
              name: profileLayout.Layout.Name,
              Id: profileLayout.Layout.Id,
              profileId: profileId,
              rid: rid
            };
          }
        } else {
          layoutData = 'new';
          console.error("Failed to fetch layout data:", await layoutResponse.text());
        }
      } catch (layoutError) {
        console.error("Error fetching layout data:", layoutError);
      }

    } else {
      console.warn("Cannot fetch layout: Missing object name or profile ID");
    }

    sendResponse({
      success: true,
      recordId: recordId,
      objectName: actualObjectName || "Unknown",
      recordData: fieldsData,
      recordTypeDatas: recordTypeData,
      users: users,
      layoutData: layoutData

    });
  } catch (error) {
    console.error("Error handling get record data:", error);
    sendResponse({
      success: false,
      error: error.message || "Failed to get record data"
    });
  }
  return true; // Keep the message channel open for async response
}

//Handle Update Record
async function handleUpdateRecordData(request, sender, sendResponse) {
  try {
    const tabUrl = sender.tab.url;
    const url = new URL(tabUrl);
    let hostName;

    // Extract Salesforce domain
    if (url.hostname.includes(".lightning.force.com")) {
      hostName = url.hostname.replace(".lightning.force.com", ".my.salesforce.com");
    } else if (url.hostname.includes(".salesforce.com")) {
      hostName = url.hostname;
    } else {
      throw new Error("Not a Salesforce domain");
    }

    // Get session
    const sessionResponse = await getSessionInfo(hostName);
    if (!sessionResponse.success) {
      throw new Error("Failed to get session info");
    }

    const { objectName, recordId, editedFields } = request;
    const sid = sessionResponse.session.key;
    const host = `https://${hostName}`;
    const apiVersion = "v58.0";

    // Validate inputs
    if (!objectName) {
      throw new Error("Object name is missing");
    }
    if (!recordId) {
      throw new Error("Record ID is missing");
    }
    if (!editedFields || Object.keys(editedFields).length === 0) {
      throw new Error("No fields provided for update");
    }

    // Fetch object describe to validate field permissions and types
    const objectDescribe = await getObjectDescribe(host, apiVersion, sid, objectName);
    const fieldPermissions = {};
    const fieldTypes = {};
    objectDescribe.fields.forEach(field => {
      fieldPermissions[field.name] = field.updateable;
      fieldTypes[field.name] = field.type;
    });

    // Check if all edited fields are editable
    const nonEditableFields = Object.keys(editedFields).filter(field => !fieldPermissions[field]);
    if (nonEditableFields.length > 0) {
      throw new Error(`User lacks permission to edit fields: ${nonEditableFields.join(', ')}`);
    }

    // Validate and format date, datetime, and email fields
    const updatePayload = {};
    for (const [fieldName, value] of Object.entries(editedFields)) {
      if (fieldTypes[fieldName] === 'date') {
        if (value === null || value === '') {
          updatePayload[fieldName] = null; // Explicitly set null for empty or null values
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          throw new Error(`Invalid date format for ${fieldName}. Expected YYYY-MM-DD`);
        } else {
          updatePayload[fieldName] = value;
        }
      } else if (fieldTypes[fieldName] === 'datetime') {
        if (value === null || value === '') {
          updatePayload[fieldName] = null; // Explicitly set null for empty or null values
        } else {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            throw new Error(`Invalid datetime format for ${fieldName}`);
          }
          updatePayload[fieldName] = date.toISOString();
        }
      } else if (fieldTypes[fieldName] === 'email' && value) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(value)) {
          throw new Error(`Invalid email format for ${fieldName}. Expected a valid email address`);
        }
        updatePayload[fieldName] = value;
      } else {
        updatePayload[fieldName] = value;
      }
    }
    // Perform the update using Salesforce REST API (PATCH request)
    const updateUrl = `${host}/services/data/${apiVersion}/sobjects/${objectName}/${recordId}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        "Authorization": `Bearer ${sid}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatePayload)
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      const errorMessage = errorData[0]?.message || updateResponse.statusText;
      throw new Error(`Failed to update record: ${errorMessage}`);
    }
    // Success response
    sendResponse({
      success: true,
      message: "Record updated successfully"
    });
  } catch (error) {
    console.error("Error handling update record data:", error);
    sendResponse({
      success: false,
      error: error.message || "Failed to update record data"
    });
  }
  return true; // Keep the message channel open for async response
}
// Retrieves all users in the Salesforce system using the REST API.

async function getAllProfiles(host, apiVersion, sid) {
  const query = encodeURIComponent('SELECT Id, Name FROM Profile');
  const url = `${host}/services/data/${apiVersion}/query?q=${query}`;
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${sid}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch profiles: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  let profiles = result.records || [];

  // Handle pagination if nextRecordsUrl exists
  while (result.nextRecordsUrl) {
    const nextResponse = await fetch(`${host}${result.nextRecordsUrl}`, {
      headers: {
        "Authorization": `Bearer ${sid}`,
        "Content-Type": "application/json"
      }
    });

    if (!nextResponse.ok) {
      throw new Error(`Failed to fetch next page of profiles: ${nextResponse.status} ${nextResponse.statusText}`);
    }

    const nextResult = await nextResponse.json();
    profiles = profiles.concat(nextResult.records || []);
    result.nextRecordsUrl = nextResult.nextRecordsUrl;
  }

  // Create a map of profile Id to profile Name
  const profileMap = new Map(profiles.map(profile => [profile.Id, profile.Name]));
  return profileMap;
}

async function getAllUsers(host, apiVersion, sid) {
  // Fetch profiles first to get the profile name mapping
  const profileMap = await getAllProfiles(host, apiVersion, sid);

  const query = encodeURIComponent('SELECT Id, Name, Username, Email, IsActive, Alias, ProfileId FROM User');
  const url = `${host}/services/data/${apiVersion}/query?q=${query}`;
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${sid}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  let users = result.records || [];

  // Handle pagination if nextRecordsUrl exists
  while (result.nextRecordsUrl) {
    const nextResponse = await fetch(`${host}${result.nextRecordsUrl}`, {
      headers: {
        "Authorization": `Bearer ${sid}`,
        "Content-Type": "application/json"
      }
    });

    if (!nextResponse.ok) {
      throw new Error(`Failed to fetch next page of users: ${nextResponse.status} ${nextResponse.statusText}`);
    }

    const nextResult = await nextResponse.json();
    users = users.concat(nextResult.records || []);
    result.nextRecordsUrl = nextResult.nextRecordsUrl;
  }

  // Map profile names to users
  users = users.map(user => ({
    ...user,
    Profile: {
      Name: profileMap.get(user.ProfileId) || 'Unknown Profile',
      Id: user.ProfileId
    }
  }));

  return { records: users };
}

// Handle copy record data request
async function handleCopyRecordData(request, sender, sendResponse) {
  try {
    const tabUrl = sender.tab.url;
    const url = new URL(tabUrl);
    let hostName;

    if (url.hostname.includes(".lightning.force.com")) {
      hostName = url.hostname.replace(".lightning.force.com", ".my.salesforce.com");
    } else if (url.hostname.includes(".salesforce.com")) {
      hostName = url.hostname;
    } else {
      throw new Error("Not a Salesforce domain");
    }

    const sessionResponse = await getSessionInfo(hostName);
    if (!sessionResponse.success) {
      throw new Error("Failed to get session info");
    }

    const sid = sessionResponse.session.key;
    const host = `https://${hostName}`;
    const apiVersion = "v58.0";

    const recordId = request.recordId;
    const objectName = request.objectName;

    const recordData = await getRecord(host, apiVersion, sid, recordId, objectName);
    const formattedData = JSON.stringify(recordData, null, 2);

    chrome.tabs.sendMessage(sender.tab.id, {
      message: "copyToClipboard",
      content: formattedData
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error("Error handling copy record data:", error);
    sendResponse({
      success: false,
      error: error.message || "Failed to copy record data"
    });
  }
}

async function handleDownloadRecordData(request, sender, sendResponse) {
  try {
    const tabUrl = sender.tab.url;
    const url = new URL(tabUrl);
    let hostName;

    if (url.hostname.includes(".lightning.force.com")) {
      hostName = url.hostname.replace(".lightning.force.com", ".my.salesforce.com");
    } else if (url.hostname.includes(".salesforce.com")) {
      hostName = url.hostname;
    } else {
      throw new Error("Not a Salesforce domain");
    }

    const sessionResponse = await getSessionInfo(hostName);
    if (!sessionResponse.success) {
      throw new Error("Failed to get session info");
    }

    const sid = sessionResponse.session.key;
    const host = `https://${hostName}`;
    const apiVersion = "v58.0";

    const recordId = request.recordId;
    const objectName = request.objectName;

    const recordData = await getRecord(host, apiVersion, sid, recordId, objectName);

    const fileName = `${objectName || "object"}_${recordId || "record"}.json`;
    const content = JSON.stringify(recordData, null, 2);

    // ✅ Convert to Base64 Data URL
    const base64Data = btoa(unescape(encodeURIComponent(content)));
    const dataUrl = `data:application/json;base64,${base64Data}`;

    chrome.downloads.download({
      url: dataUrl,
      filename: fileName,
      saveAs: true
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error("Error handling download record data:", error);
    sendResponse({
      success: false,
      error: error.message || "Failed to download record data"
    });
  }
}
// Get session info helper function (returns a Promise)
function getSessionInfo(hostName) {
  return new Promise((resolve, reject) => {
    chrome.cookies.get(
      {
        url: "https://" + hostName,
        name: "sid"
      },
      (sessionCookie) => {
        if (!sessionCookie) {
          resolve({ success: false, error: "Session cookie not found" });
          return;
        }

        resolve({
          success: true,
          session: {
            key: sessionCookie.value,
            hostName: sessionCookie.domain,
          }
        });
      }
    );
  });
}

// Fetch flow metadata from Salesforce
async function fetchFlow(host, apiVersion, sid, flowId) {
  const url = `${host}/services/data/${apiVersion}/tooling/sobjects/Flow/${flowId}`;
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${sid}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch flow: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Get object describe information
async function getObjectDescribe(host, apiVersion, sid, objectName) {
  const url = `${host}/services/data/${apiVersion}/sobjects/${objectName}/describe`;
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${sid}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch object describe: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Get record data using the UI API
async function getRecord(host, apiVersion, sid, recordId, objectType) {
  // Try UI API first
  try {
    // Fix: Change ui-api/record/ to ui-api/records/ (note the 's')
    const url = `${host}/services/data/${apiVersion}/ui-api/records/${recordId}`;
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${sid}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`UI API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Handle possible response formats
    if (result.fields) {
      return result.fields;
    } else if (result.records && result.records.length > 0 && result.records[0].fields) {
      return result.records[0].fields;
    } else if (typeof result === 'object' && result !== null) {
      // If we have an object response but not in the expected format
      const cleanResult = { ...result };
      if (cleanResult.attributes) {
        delete cleanResult.attributes;
      }
      return cleanResult;
    } else {
      throw new Error("Unexpected response format from UI API");
    }
  } catch (uiApiError) {
    console.warn("UI API failed, falling back to REST API:", uiApiError.message);

    // Check if objectType is provided
    if (!objectType) {
      throw new Error("Object type is required for REST API fallback but was not provided");
    }

    // Fallback to standard REST API
    try {
      const url = `${host}/services/data/${apiVersion}/sobjects/${objectType}/${recordId}`;
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${sid}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`REST API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // Verify we have a valid result
      if (typeof result !== 'object' || result === null) {
        throw new Error("REST API returned an invalid response format");
      }

      // Remove unnecessary metadata
      const cleanResult = { ...result };
      if (cleanResult.attributes) {
        delete cleanResult.attributes;
      }

      return cleanResult;
    } catch (restApiError) {
      throw new Error(`Failed to fetch record from both APIs: ${restApiError.message}`);
    }
  }
}


// On extension install
chrome.runtime.onInstalled.addListener(() => {
  console.log("Salesforce Flow Tools extension installed");
});