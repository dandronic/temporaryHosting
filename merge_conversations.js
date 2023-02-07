
async function fetchLastMessage(oldConversationId) {
    return resp = await fetch('https://dev.dixa.io/v1/conversations/'+oldConversationId+'/messages', {
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + dixaApiToken
        }
    })
    .then(response => response.json())
    .then(messages => {
        if(messages.data) {
            let inboundMessages = messages.data.filter(x => x.attributes?.direction == "Inbound");
            if(inboundMessages.length >= 1) {
                let lastMessage =  inboundMessages[inboundMessages.length - 1]; //.attributes?.emailContent?.content?.value
                if(lastMessage.attributes?.emailContent)
                    return lastMessage.attributes?.emailContent?.content?.value;
                else
                    return lastMessage.attributes?.content?.value;
            }
               
            else return false;
        } 
        else return false;
    });
}

function addInternalNote(conversationId, messageText) {
    fetch(
        `https://dev.dixa.io/v1/conversations/${conversationId}/notes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: dixaApiToken
          },
          body: JSON.stringify({
            message: messageText
          })
        }
      ).then(function(response) {
        if(response.status >= 400)
        throwError('Failed to add internal note to conversation ' + conversationId + ' - status code ' + response.status);
    }).catch((error) => {
       throwError('Failed to add internal note to conversation ' + conversationId);
      });
}

function closeConversation(oldConversationId) {
    fetch('https://dev.dixa.io/v1/conversations/'+oldConversationId+'/close', {
        method: 'PUT',
        headers: {
            Authorization: 'Bearer ' + dixaApiToken
        }
    }).then(function(response) {
       if(response.status >= 400)
       throwError('Failed to close conversation ' +  oldConversationId + ' - status code ' + response.status);
    }).catch((error) => {
       throwError('Failed to close conversation ' +  oldConversationId);
      })
}
function claimConversation(oldConversationId) {
    fetch('https://dev.dixa.io/v1/conversations/'+oldConversationId+'/claim', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + dixaApiToken
        },
        body: JSON.stringify({
            agentId: 52eae94d-f27f-4782-b108-0fe9f2c5bb1b,
            force: true
          })
    }).then(function(response) {
       if(response.status >= 400)
       throwError('Failed to claim conversation ' +  oldConversationId + ' - status code ' + response.status);
    }).catch((error) => {
       throwError('Failed to claim conversation ' +  oldConversationId);
      })
}

function mergeConversations(oldConversationId, newConversationId) {
    clearError();
    dixaDomain = dixaSubdomain.replace('https://','').replace('.dixa.com','');
    if(!Number.isInteger(newConversationId) || !Number.isInteger(oldConversationId))
        throwError('One of the conversation IDs is invalid.');
    else
        fetchLastMessage(oldConversationId).then(
            messageContent => {
                if(messageContent) {
                    addInternalNote(newConversationId, "**Merged from conversation <a href=\"https://" + dixaDomain + ".dixa.com/conversation/" + oldConversationId + "\">" + oldConversationId + "</a>** : \n\n"+messageContent);
                    addInternalNote(oldConversationId, "Merged this conversation into conversation <a href=\"https://" + dixaDomain + ".dixa.com/conversation/"+newConversationId+"\">#" + newConversationId+"</a>");
                    claimConversation(oldConversationId);
                    closeConversation(oldConversationId);
                }
                else
                throwError('Something went wrong fetching the message content. Please try again later.');
               
            }
     );
    return false;
}

function throwError(message) {
    document.getElementById('error').innerText = message;
    document.getElementById('error').style.display = "block";
    return false;
}
function clearError() {
    document.getElementById('error').innerText = '';
    document.getElementById('error').style.display = "none";
}
