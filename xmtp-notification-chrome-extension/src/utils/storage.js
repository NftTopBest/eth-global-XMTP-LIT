/*global chrome*/

const storage = {
    set: async (key, data) => {
        chrome.storage.sync.set({ [key]: JSON.stringify(data) }, () => {
            return data;
        });
    },
    get: async (key) => {
        chrome.storage.sync.get([key], function (result) {
            return result;
        });
    }
}

export default storage;