export const RECENT_EVENT_MESSAGES = 'RECENT_EVENT_MESSAGES'
export const NEW_EVENT_MESSAGE = 'NEW_EVENT_MESSAGE'
export const CLEAR_EVENT_MESSAGES = 'CLEAR_EVENT_MESSAGES'

export function recentEventMessages(messages) {
  let recentMessages = messages.reverse()
  return { 
    type: RECENT_EVENT_MESSAGES, 
    payload: recentMessages
  }
}

export function newEventMessage(message) {
  return {
    type: NEW_EVENT_MESSAGE,
    payload: message
  }
}

export function clearEventMessages() {
  
  return {
    type: CLEAR_EVENT_MESSAGES,
    payload: []
  }
}
