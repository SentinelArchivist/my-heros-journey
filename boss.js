// Boss battle system
class BossManager {
    constructor(playerStats) {
        this.playerStats = playerStats;
        this.loadBossData();
    }

    // Initialize default boss data
    initializeDefaultBoss() {
        return {
            name: "The Procrastination Hydra",
            maxHp: 100,
            currentHp: 100,
            isDefeated: false,
            tasks: [
                { 
                    id: 'task1', 
                    description: "Complete 3 daily quests in one day", 
                    target: 3, 
                    currentProgress: 0, 
                    isComplete: false, 
                    damage: 40 
                },
                { 
                    id: 'task2', 
                    description: "Achieve a 5-day streak on any quest", 
                    target: 5, 
                    currentProgress: 0, 
                    isComplete: false, 
                    damage: 60 
                }
            ],
            reward: { xp: 200, lootBox: true }
        };
    }

    // Load boss data from local storage
    loadBossData() {
        try {
            const storedBoss = localStorage.getItem('currentBoss');
            this.currentBoss = storedBoss ? JSON.parse(storedBoss) : this.initializeDefaultBoss();
        } catch (error) {
            console.error('Failed to load boss data:', error);
            this.currentBoss = this.initializeDefaultBoss();
        }
        this.renderBossInfo();
    }

    // Save boss data to local storage
    saveBossData() {
        try {
            localStorage.setItem('currentBoss', JSON.stringify(this.currentBoss));
        } catch (error) {
            console.error('Failed to save boss data:', error);
        }
    }

    // Create boss info component
    createBossElement() {
        const container = document.createElement('div');
        container.className = 'boss-container';

        // Boss header
        const header = document.createElement('h2');
        header.textContent = '🐉 Boss Battle';
        container.appendChild(header);

        // Boss name
        const name = document.createElement('h3');
        name.textContent = this.currentBoss.name;
        container.appendChild(name);

        // HP bar
        const hpContainer = document.createElement('div');
        hpContainer.className = 'boss-hp-container';
        
        const hpBar = document.createElement('div');
        hpBar.className = 'boss-hp-bar';
        const hpPercentage = (this.currentBoss.currentHp / this.currentBoss.maxHp) * 100;
        hpBar.style.width = `${hpPercentage}%`;
        
        const hpText = document.createElement('p');
        hpText.textContent = `HP: ${this.currentBoss.currentHp}/${this.currentBoss.maxHp}`;
        
        hpContainer.appendChild(hpBar);
        hpContainer.appendChild(hpText);
        container.appendChild(hpContainer);

        // Tasks
        const taskList = document.createElement('ul');
        taskList.className = 'boss-tasks';

        this.currentBoss.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `boss-task ${task.isComplete ? 'complete' : ''}`;
            
            const progress = document.createElement('div');
            progress.className = 'task-progress';
            progress.textContent = `${task.currentProgress}/${task.target}`;
            
            const desc = document.createElement('div');
            desc.className = 'task-description';
            desc.textContent = task.description;
            
            const damage = document.createElement('div');
            damage.className = 'task-damage';
            damage.textContent = `Damage: ${task.damage}`;
            
            li.appendChild(desc);
            li.appendChild(progress);
            li.appendChild(damage);
            
            taskList.appendChild(li);
        });

        container.appendChild(taskList);

        if (this.currentBoss.isDefeated) {
            const defeatedBadge = document.createElement('div');
            defeatedBadge.className = 'boss-defeated';
            defeatedBadge.textContent = 'DEFEATED!';
            container.appendChild(defeatedBadge);
        }

        return container;
    }

    // Render boss information
    renderBossInfo() {
        const bossSection = document.getElementById('bossSection');
        if (!bossSection) return;

        bossSection.innerHTML = '';
        const bossElement = this.createBossElement();
        bossSection.appendChild(bossElement);
    }

    // Update boss progress based on quest completion
    updateBossProgress(questCompletedTodayCount, longestStreak) {
        let damaged = false;
        let progressChanged = false; // Flag to check if any task progress text needs updating
        
        // Check task 1: Complete 3 daily quests
        const task1 = this.currentBoss.tasks[0];
        if (task1.currentProgress !== questCompletedTodayCount) {
            task1.currentProgress = questCompletedTodayCount;
            progressChanged = true;
        }
        if (!task1.isComplete && questCompletedTodayCount >= task1.target) {
            // task1.currentProgress = questCompletedTodayCount; // Already set above
            if (!task1.isComplete) { // Double check, though outer condition should suffice
                task1.isComplete = true;
                this.currentBoss.currentHp = Math.max(0, this.currentBoss.currentHp - task1.damage);
                damaged = true;
                progressChanged = true; // Ensure re-render if task completes
            }
        }

        // Check task 2: 5-day streak
        const task2 = this.currentBoss.tasks[1];
        if (task2.currentProgress !== longestStreak) {
            task2.currentProgress = longestStreak;
            progressChanged = true;
        }
        if (!task2.isComplete && longestStreak >= task2.target) {
            // task2.currentProgress = longestStreak; // Already set above
            if (!task2.isComplete) { // Double check
                task2.isComplete = true;
                this.currentBoss.currentHp = Math.max(0, this.currentBoss.currentHp - task2.damage);
                damaged = true;
                progressChanged = true; // Ensure re-render if task completes
            }
        }

        // Check if boss is defeated
        if (!this.currentBoss.isDefeated && this.currentBoss.currentHp <= 0) {
            this.currentBoss.isDefeated = true;
            this.playerStats.showNotification(`Boss Defeated: ${this.currentBoss.name}!`, 'boss-defeated-notification');
            
            // Grant rewards
            this.playerStats.addXP(this.currentBoss.reward.xp);
            if (this.currentBoss.reward.lootBox) {
                this.playerStats.openLootBox('boss-defeat');
            }
            damaged = true; // To trigger save and render
        }

        if (damaged || progressChanged) { // Save and render if damage occurred OR if progress text changed
            this.saveBossData();
            this.renderBossInfo();
        }
    }
}
