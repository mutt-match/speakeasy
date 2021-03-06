export default function(state = [], action) {
  switch(action.type) {
    case 'RECENT_DIRECT_MESSAGES':
      if (action.payload.length === 0) {
        return state;
      } else {
        return action.payload;
      }
    case 'NEW_DIRECT_MESSAGE':
      return [...state, action.payload];
    case 'CLEAR_DIRECT_MESSAGES':
      return action.payload;
    default: return state;
  }
}
 
