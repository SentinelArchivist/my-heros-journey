// Loot table definition
const lootTable = [
    { 
        id: 'scroll_minor_wisdom',
        name: "Scroll of Minor Wisdom", 
        description: "Grants +10 bonus XP when used.", 
        effect: (playerStats) => {
            playerStats.addXP(10);
            return "✨ +10 XP granted!";
        },
        type: 'consumable',
        rarity: 'common',
        consumable: true
    },
    { 
        id: 'adventurers_cloak',
        name: "Worn Adventurer's Cloak", 
        description: "A cosmetic cloak for your profile.", 
        effect: null, 
        type: 'cosmetic',
        rarity: 'uncommon',
        consumable: false
    },
    { 
        id: 'questing_boots',
        name: "Sturdy Questing Boots", 
        description: "Makes completing quests feel a bit easier.", 
        effect: null, 
        type: 'passive_buff_placeholder',
        rarity: 'rare',
        consumable: false
    },
    {
        id: 'ancient_tome',
        name: "Ancient Tome of Knowledge",
        description: "Grants +25 bonus XP when used.",
        effect: (playerStats) => {
            playerStats.addXP(25);
            return "✨ +25 XP granted!";
        },
        type: 'consumable',
        rarity: 'rare',
        consumable: true
    },
    {
        id: 'lucky_coin',
        name: "Lucky Coin",
        description: "A shiny gold coin that brings good fortune.",
        effect: null,
        type: 'cosmetic',
        rarity: 'uncommon',
        consumable: false
    }
];

// Player stats management
class PlayerStats {
    constructor() {
        this.loadPlayerStats();
        this.renderInventory();  // Initialize inventory display
    }

    // Initialize default player stats
    initializeDefaultStats() {
        return {
            name: 'Hero',
            xp: 0,
            level: 1,
            xpToNextLevel: 100,
            inventory: [],
            lastVisitDate: null
        };
    }

    // Save player stats to local storage
    savePlayerStats() {
        try {
            const statsToSave = {
                ...this.stats,
                xp: Number(this.stats.xp), // Ensure XP is a number
                level: Number(this.stats.level), // Ensure level is a number
                xpToNextLevel: Number(this.stats.xpToNextLevel) // Ensure xpToNextLevel is a number
            };
            localStorage.setItem('heroPlayerStats', JSON.stringify(statsToSave));
            console.log('Saved stats:', statsToSave);
        } catch (error) {
            console.error('Failed to save player stats:', error);
        }
    }

    // Load player stats from local storage
    loadPlayerStats() {
        try {
            const storedStats = localStorage.getItem('heroPlayerStats');
            this.stats = storedStats ? JSON.parse(storedStats) : this.initializeDefaultStats();
            
            // Ensure all numeric values are properly typed
            this.stats.xp = Number(this.stats.xp) || 0;
            this.stats.level = Number(this.stats.level) || 1;
            this.stats.xpToNextLevel = Number(this.stats.xpToNextLevel) || 100;
            
            // Ensure inventory exists and item effects are properly bound
            if (!this.stats.inventory) {
                this.stats.inventory = [];
            } else {
                // Rebind item effects from lootTable
                this.stats.inventory = this.stats.inventory.map(item => {
                    if (item.consumable) {
                        const lootItem = lootTable.find(l => l.id === item.id);
                        if (lootItem) {
                            item.effect = lootItem.effect;
                        }
                    }
                    return item;
                });
            }

            // Ensure lastVisitDate exists
            if (!this.stats.lastVisitDate) {
                // Get today's date in local timezone
                const now = new Date();
                this.stats.lastVisitDate = now.getFullYear() + '-' + 
                    String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(now.getDate()).padStart(2, '0');
            }

            console.log('Loaded stats:', this.stats);
        } catch (error) {
            console.error('Failed to load player stats:', error);
            this.stats = this.initializeDefaultStats();
        }
        this.renderPlayerStats();
        this.renderInventory();  // Always render inventory after loading
    }

    // Add XP and check for level up
    addXP(amount) {
        if (!Number.isFinite(amount)) {
            console.error('Invalid XP amount:', amount);
            return;
        }
        const currentXP = this.stats.xp;
        this.stats.xp = currentXP + amount;
        console.log(`Adding ${amount} XP. Before: ${currentXP}, After: ${this.stats.xp}`);
        this.checkLevelUp();
        this.savePlayerStats();
        this.renderPlayerStats();
    }

    // Remove XP (when unchecking a quest)
    removeXP(amount) {
        const minXP = (this.stats.level - 1) * this.stats.xpToNextLevel;
        this.stats.xp = Math.max(minXP, this.stats.xp - amount);
        this.savePlayerStats();
        this.renderPlayerStats();
    }

    // Check if player should level up
    checkLevelUp() {
        if (this.stats.xp >= this.stats.xpToNextLevel) {
            this.stats.xp -= this.stats.xpToNextLevel;
            this.stats.level++;
            this.stats.xpToNextLevel = Math.floor(this.stats.xpToNextLevel * 1.5);
            
            // Show level up notification and reward
            this.showLevelUpNotification();
            
            // Check for multiple level ups
            this.checkLevelUp();
        }
    }

    // Show a notification
    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `toast-notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Remove after duration
        setTimeout(() => {
            notification.classList.remove('show');
            // Remove from DOM after animation
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500); // Match CSS transition duration
        }, duration);
    }

    // Open a loot box
    openLootBox(reason = 'level up') {
        if (lootTable.length === 0) {
            this.showNotification('No items available in the loot table!', 'error');
            return;
        }

        // Simple random item for now
        const randomIndex = Math.floor(Math.random() * lootTable.length);
        const item = { ...lootTable[randomIndex] }; // Create a copy
        item.instanceId = Date.now(); // Unique ID for this instance

        this.stats.inventory.push(item);
        this.savePlayerStats();
        this.renderInventory();
        this.showNotification(`🎁 ${reason}! You found: ${item.name}!`, 'success');
    }

    // Use a consumable item
    useItem(instanceId) {
        const itemIndex = this.stats.inventory.findIndex(i => i.instanceId === instanceId);
        if (itemIndex === -1) {
            this.showNotification('Item not found!', 'error');
            return;
        }

        const item = this.stats.inventory[itemIndex];

        if (!item.consumable) {
            this.showNotification(`${item.name} is not a consumable item.`, 'info');
            return;
        }

        if (item.effect) {
            const effectMessage = item.effect(this); // Pass playerStats to the effect function
            this.showNotification(effectMessage || `${item.name} used!`, 'success');
        } else {
            this.showNotification(`${item.name} used, but it had no immediate effect.`, 'info');
        }

        // Remove item from inventory
        this.stats.inventory.splice(itemIndex, 1);
        this.savePlayerStats();
        this.renderInventory();
        this.renderPlayerStats(); // Update stats display if XP changed
    }

    // Create inventory item component
    createInventoryItemElement(item) {
        const li = document.createElement('li');
        li.className = `inventory-item ${item.rarity}`;

        // Create item name
        const itemName = document.createElement('div');
        itemName.className = 'item-name';
        itemName.textContent = item.name;

        // Create item description
        const itemDesc = document.createElement('div');
        itemDesc.className = 'item-description';
        itemDesc.textContent = item.description;

        // Add name and description
        li.appendChild(itemName);
        li.appendChild(itemDesc);

        // Add use button or used badge for consumables
        if (item.consumable) {
            if (!item.used) {
                const useButton = document.createElement('button');
                useButton.className = 'use-item-button';
                useButton.textContent = 'Use';
                useButton.onclick = (e) => {
                    e.stopPropagation();
                    this.useItem(item.instanceId);
                };
                li.appendChild(useButton);
            } else {
                const usedBadge = document.createElement('span');
                usedBadge.className = 'used-badge';
                usedBadge.textContent = 'Used';
                itemName.appendChild(usedBadge);
            }
        }

        return li;
    }

    // Create empty inventory message component
    createEmptyInventoryMessage() {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-inventory';
        emptyMessage.textContent = 'Your inventory is empty. Complete quests to earn rewards!';
        return emptyMessage;
    }

    // Render inventory
    renderInventory() {
        const inventoryList = document.getElementById('inventoryList');
        if (!inventoryList) return;

        inventoryList.innerHTML = '';

        if (this.stats.inventory.length === 0) {
            inventoryList.appendChild(this.createEmptyInventoryMessage());
            return;
        }

        // Create and append each inventory item
        this.stats.inventory.forEach(item => {
            const itemElement = this.createInventoryItemElement(item);
            inventoryList.appendChild(itemElement);
        });
    }

    // Show level up notification
    showLevelUpNotification() {
        this.showNotification(`⚔️ Level Up! You are now Level ${this.stats.level}! ⚔️`);
        // Slight delay before showing loot box notification
        setTimeout(() => {
            this.openLootBox('level up');
        }, 100);
    }

    // Create player stats component
    createPlayerStatsElement() {
        const container = document.createElement('div');
        container.className = 'player-stats';

        // Create name and level
        const header = document.createElement('h2');
        const nameSpan = document.createElement('span');
        nameSpan.id = 'playerName';
        nameSpan.textContent = this.stats.name;

        const levelText = document.createTextNode(' - Level ');

        const levelSpan = document.createElement('span');
        levelSpan.id = 'playerLevel';
        levelSpan.textContent = this.stats.level;

        header.appendChild(nameSpan);
        header.appendChild(levelText);
        header.appendChild(levelSpan);

        // Create XP bar container
        const xpContainer = document.createElement('div');
        xpContainer.className = 'xp-bar-container';

        const xpBar = document.createElement('div');
        xpBar.id = 'xpBar';
        xpBar.className = 'xp-bar';
        const xpPercentage = (this.stats.xp / this.stats.xpToNextLevel) * 100;
        xpBar.style.width = `${xpPercentage}%`;

        const xpText = document.createElement('p');
        xpText.innerHTML = `XP: <span id="playerXP">${this.stats.xp}</span> / <span id="xpToNextLevel">${this.stats.xpToNextLevel}</span>`;

        xpContainer.appendChild(xpBar);
        xpContainer.appendChild(xpText);

        // Assemble the component
        container.appendChild(header);
        container.appendChild(xpContainer);

        return container;
    }

    // Update player stats display
    renderPlayerStats() {
        const statsContainer = document.getElementById('playerStats');
        if (!statsContainer) return;

        // Clear existing content
        statsContainer.innerHTML = '';

        // Create and append new stats element
        const statsElement = this.createPlayerStatsElement();
        statsContainer.appendChild(statsElement);
    }
}

class QuestManager {
    constructor(playerStats, bossManager) {
        this.playerStats = playerStats;
        this.bossManager = bossManager;
        this.quests = [];
        this.initializeEventListeners();
        this.loadQuests();
        this.performDailyResetChecks();  // Check for daily reset on startup
    }

    // Perform daily reset checks
    performDailyResetChecks() {
        // Get today's date in local timezone
        const now = new Date();
        const today = now.getFullYear() + '-' + 
            String(now.getMonth() + 1).padStart(2, '0') + '-' + 
            String(now.getDate()).padStart(2, '0');
        const lastVisit = this.playerStats.stats.lastVisitDate;

        console.log('Performing daily reset check:', { today, lastVisit });

        // If this is not the first visit and it's a new day
        if (lastVisit && lastVisit < today) {
            console.log('New day detected, processing resets...');
            
            // Calculate days between visits
            const lastVisitDate = new Date(lastVisit + 'T00:00:00');
            const todayDate = new Date(today + 'T00:00:00');
            const daysDiff = Math.floor((todayDate - lastVisitDate) / (1000 * 60 * 60 * 24));
            
            console.log(`Days since last visit: ${daysDiff}`);
            
            // Process each quest
            this.quests.forEach(quest => {
                if (daysDiff > 1) {
                    // If more than one day has passed, always reset streak
                    console.log(`Breaking streak for quest due to ${daysDiff} day gap: ${quest.title}`);
                    quest.streak = 0;
                } else if (!quest.completedToday) {
                    // For one day gap, only break streak if quest wasn't completed
                    console.log(`Breaking streak for incomplete quest: ${quest.title}`);
                    quest.streak = 0;
                }
                // Reset completion status for the new day
                quest.completedToday = false;
            });

            // Update last visit date and save everything
            this.playerStats.stats.lastVisitDate = today;
            this.playerStats.savePlayerStats();
            this.saveQuests();
            
            // Update UI
            this.renderQuests();
            this.playerStats.renderPlayerStats();
        } else if (!lastVisit) {
            // First visit ever, just set the date
            this.playerStats.stats.lastVisitDate = today;
            this.playerStats.savePlayerStats();
        }
    }

    // Initialize all event listeners for user interactions
    initializeEventListeners() {
        const addQuestButton = document.getElementById('addQuestButton');
        const questTitleInput = document.getElementById('questTitleInput');
        const questDescriptionInput = document.getElementById('questDescriptionInput');

        if (addQuestButton) {
            addQuestButton.addEventListener('click', () => this.addQuest());
        }

        // Add Enter key functionality
        const handleEnterKey = (e) => {
            if (e.key === 'Enter') {
                // If Enter is pressed in description field or title field has content
                if (e.target === questDescriptionInput || 
                    (e.target === questTitleInput && questTitleInput.value.trim())) {
                    this.addQuest();
                }
            }
        };

        if (questTitleInput) {
            questTitleInput.addEventListener('keypress', handleEnterKey);
        }
        if (questDescriptionInput) {
            questDescriptionInput.addEventListener('keypress', handleEnterKey);
        }

        // Event delegation for quest list interactions
        const questList = document.getElementById('questList');
        questList.addEventListener('change', (e) => {
            if (e.target.matches('.complete-checkbox')) {
                this.handleQuestCompletion(e.target);
            }
        });
    }

    // Create a quest component
    createQuestListItem(quest) {
        const li = document.createElement('li');
        li.className = 'quest-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'complete-checkbox';
        checkbox.checked = quest.completedToday;
        checkbox.dataset.questId = quest.id;
        checkbox.addEventListener('change', (e) => this.handleQuestCompletion(e.target));
        
        const questInfo = document.createElement('div');
        questInfo.className = 'quest-info';
        
        const titleContainer = document.createElement('div');
        titleContainer.className = 'quest-title-container';
        
        const title = document.createElement('div');
        title.className = 'quest-title';
        title.textContent = quest.title;
        titleContainer.appendChild(title);
        
        if (quest.description) {
            const description = document.createElement('div');
            description.className = 'quest-description';
            description.textContent = quest.description;
            titleContainer.appendChild(description);
        }
        
        questInfo.appendChild(titleContainer);
        
        const streak = document.createElement('div');
        streak.className = 'streak-counter';
        streak.textContent = `🔥 ${quest.streak} day streak`;
        questInfo.appendChild(streak);
        
        li.appendChild(checkbox);
        li.appendChild(questInfo);
        
        return li;
    }

    // Create empty state message component
    createEmptyQuestMessage() {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-quests';
        emptyMessage.textContent = 'No quests yet... Add one above!';
        return emptyMessage;
    }

    // Create a new quest object
    createQuest(title, description) {
        return {
            id: Date.now(),
            title: title.trim(),
            description: description.trim(),
            completedToday: false,
            streak: 0,
            createdDate: new Date()
        };
    }

    // Add a new quest
    addQuest() {
        const titleInput = document.getElementById('questTitleInput');
        const descriptionInput = document.getElementById('questDescriptionInput');
        
        const title = titleInput.value.trim();
        if (!title) {
            this.playerStats.showNotification('Please enter a quest title!', 'error');
            return;
        }

        const quest = this.createQuest(title, descriptionInput.value);
        this.quests.push(quest);
        this.saveQuests();
        this.renderQuests();

        // Clear input fields
        titleInput.value = '';
        descriptionInput.value = '';
    }

    // Save quests to local storage
    saveQuests() {
        try {
            localStorage.setItem('heroQuests', JSON.stringify(this.quests));
        } catch (error) {
            console.error('Failed to save quests:', error);
        }
    }

    // Load quests from local storage
    loadQuests() {
        try {
            const storedQuests = localStorage.getItem('heroQuests');
            this.quests = storedQuests ? JSON.parse(storedQuests) : [];
        } catch (error) {
            console.error('Failed to load quests:', error);
            this.quests = [];
        }
        this.renderQuests();
    }

    // Handle quest completion toggle
    handleQuestCompletion(checkbox) {
        const questId = parseInt(checkbox.dataset.questId);
        const quest = this.quests.find(q => q.id === questId);
        
        if (quest) {
            const wasCompletedBefore = quest.completedToday;
            quest.completedToday = checkbox.checked;
            
            // Update streak and XP
            if (checkbox.checked && !wasCompletedBefore) {
                // Only increment streak and XP if it wasn't already completed
                quest.streak++;
                this.playerStats.addXP(10);  // Grant XP for completing quest
                
                // Check for streak milestone rewards
                if (quest.streak % 7 === 0) { // Every 7 days
                    this.playerStats.openLootBox('7-day streak');
                }
            } else if (!checkbox.checked && wasCompletedBefore) {
                // Only decrement streak and XP if it was previously completed
                quest.streak = Math.max(0, quest.streak - 1);
                this.playerStats.removeXP(10);  // Remove XP for uncompleting quest
            }
            
            // Update boss progress
            const completedToday = this.quests.filter(q => q.completedToday).length;
            const longestStreak = Math.max(...this.quests.map(q => q.streak));
            this.bossManager.updateBossProgress(completedToday, longestStreak);
            
            this.saveQuests();
            this.renderQuests(); // Re-render to update streak display
        }
    }

    // Render all quests
    renderQuests() {
        const questList = document.getElementById('questList');
        if (!questList) return;

        questList.innerHTML = '';

        if (this.quests.length === 0) {
            questList.appendChild(this.createEmptyQuestMessage());
            return;
        }

        // Create and append each quest item
        this.quests.forEach(quest => {
            const questElement = this.createQuestListItem(quest);
            questList.appendChild(questElement);
        });
    }
}

// Initialize the application components when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const playerStats = new PlayerStats();
    const bossManager = new BossManager(playerStats);
    const questManager = new QuestManager(playerStats, bossManager);

    // Event listeners are crucial for interactivity
    questManager.initializeEventListeners();

    // Initial rendering of components is largely handled within their constructors
    // e.g., playerStats.renderPlayerStats(), questManager.renderQuests(), etc.
    // are called during their respective load/init methods within constructors.
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js') // Assuming sw.js is in the root
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}
