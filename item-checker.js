import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export class ItemChecker {
    constructor(db) {
        this.db = db;
        this.inventory = [];
    }

    async syncInventory() {
        try {
            const snap = await getDocs(collection(this.db, "inventory_item"));
            let flattened = [];
            
            snap.forEach(doc => {
                const data = doc.data();
                if (data.details && Array.isArray(data.details)) {
                    data.details.forEach(detail => {
                        if (detail.variations && Array.isArray(detail.variations)) {
                            detail.variations.forEach(v => {
                                // FIX: We use 'qty' directly as the SET count to match Homepage.
                                const currentSets = parseFloat(v.qty) || 0;
                                const innerCount = parseFloat(v.inner) || 1; 

                                flattened.push({
                                    docId: doc.id,
                                    name: detail.name || "Unknown",
                                    size: v.size || "-",
                                    price: parseFloat(v.price) || 0,
                                    currentSets: currentSets, 
                                    inner: innerCount, // e.g., 6 pieces per set
                                    displayStock: `${currentSets} ${v.unit || 'SET'}`,
                                    unit: v.unit || 'SET'
                                });
                            });
                        }
                    });
                }
            });
            
            this.inventory = flattened;
            return this.inventory.length;
        } catch (e) {
            console.error("Inventory Sync Error:", e);
            throw e;
        }
    }

    search(query) {
        const q = query.toLowerCase().trim();
        if (!q) return [];
        return this.inventory.filter(item => item.name.toLowerCase().includes(q)).slice(0, 10); 
    }

    /**
     * SOLUTION FOR 20 PIECES:
     * If customer buys 20 pieces and 1 set = 6 pieces,
     * we subtract (20 / 6) = 3.3 sets from the Homepage total.
     */
     calculateStockDeduction(name, size, qtySold) {
    const item = this.inventory.find(i => i.name === name && i.size === size);
    if (!item) return null;

    // Convert everything to numbers strictly to avoid NaN
    const currentQty = parseFloat(item.currentSets) || 0;
    const innerCount = parseFloat(item.inner) || 1;
    
    // Calculate how many 'sets' or 'boxes' to remove
    const setsToRemove = qtySold / innerCount;
    const newTotal = currentQty - setsToRemove;

    return {
        docId: item.docId,
        // We use parseFloat and toFixed to keep it clean but still a number
        newTotalPieces: parseFloat(newTotal.toFixed(2))
    };
}

    }
