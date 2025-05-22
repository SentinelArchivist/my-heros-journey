// Quest management system
class QuestManager {
    constructor() {
        this.quests = [];
        this.initializeEventListeners();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        const addButton = document.getElementById('addQuestButton');
        addButton.addEventListener('click', () => this.addQuest());
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
            alert('Please enter a quest title!');
            return;
        }

        const quest = this.createQuest(title, descriptionInput.value);
        this.quests.push(quest);
        this.renderQuests();

        // Clear input fields
        titleInput.value = '';
        descriptionInput.value = '';
    }

    // Render all quests to the DOM
    renderQuests() {
        const questList = document.getElementById('questList');
        questList.innerHTML = '';

        this.quests.forEach(quest => {
            const li = document.createElement('li');
            
            // Create checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'complete-checkbox';
            checkbox.dataset.questId = quest.id;
            checkbox.checked = quest.completedToday;
            
            // Create quest title
            const titleSpan = document.createElement('span');
            titleSpan.textContent = quest.title;
            
            // Create description (if exists)
            const descSpan = document.createElement('span');
            if (quest.description) {
                descSpan.textContent = ` - ${quest.description}`;
                descSpan.className = 'quest-description';
            }

            // Assemble the quest item
            li.appendChild(checkbox);
            li.appendChild(titleSpan);
            if (quest.description) {
                li.appendChild(descSpan);
            }
            
            questList.appendChild(li);
        });
    }
}

// Initialize the quest manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.questManager = new QuestManager();
});
