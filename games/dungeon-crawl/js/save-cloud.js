export async function cloudSave(slot, data) {
  const userId = window.__IDLE_MINDS_USER_ID__;
  if (!userId) {
    console.warn('Not authenticated, skipping cloud save');
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const response = await fetch(`/api/saves/dungeon-crawl/${slot}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Cloud save failed:', error);
    return { success: false, error: error.message };
  }
}

export async function cloudLoad(slot) {
  const userId = window.__IDLE_MINDS_USER_ID__;
  if (!userId) {
    console.warn('Not authenticated, skipping cloud load');
    return null;
  }

  try {
    const response = await fetch(`/api/saves/dungeon-crawl/${slot}`, {
      method: 'GET',
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.empty) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Cloud load failed:', error);
    return null;
  }
}

export async function cloudDelete(slot) {
  const userId = window.__IDLE_MINDS_USER_ID__;
  if (!userId) {
    console.warn('Not authenticated, skipping cloud delete');
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const response = await fetch(`/api/saves/dungeon-crawl/${slot}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Cloud delete failed:', error);
    return { success: false, error: error.message };
  }
}
