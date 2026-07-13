export function computeDelta(oldData: any, newData: any) {
  const delta: any = { addedOrUpdated: {}, removed: {} };

  const collections = ['clients', 'cases', 'notes', 'documents', 'events'];
  for (const col of collections) {
    const oldItems = oldData?.[col] || [];
    const newItems = newData?.[col] || [];
    
    const oldMap = new Map();
    for (const item of oldItems) {
      if (item && item.id) oldMap.set(item.id, JSON.stringify(item));
    }
    
    const addedOrUpdated = [];
    const newIds = new Set();
    
    for (const item of newItems) {
      if (!item || !item.id) continue;
      newIds.add(item.id);
      const strItem = JSON.stringify(item);
      if (!oldMap.has(item.id) || oldMap.get(item.id) !== strItem) {
        addedOrUpdated.push(item);
      }
    }
    
    const removedIds = [];
    for (const oldItem of oldItems) {
      if (oldItem && oldItem.id && !newIds.has(oldItem.id)) {
        removedIds.push(oldItem.id);
      }
    }
    
    delta.addedOrUpdated[col] = addedOrUpdated;
    delta.removed[col] = removedIds;
  }
  
  return delta;
}
