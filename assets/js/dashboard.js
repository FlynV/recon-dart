class DashboardManager {
    constructor() {
        this.games = new Map();
        this.fileHandler = new FileHandler(this);
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // File upload handling
        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('fileUpload');

        dropzone.addEventListener('click', () => fileInput.click());
        
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });
        
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith('.zip')) {
                this.fileHandler.handleZipFile(file);
            }
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.fileHandler.handleZipFile(file);
        });

        // Back button
        document.getElementById('back-button').addEventListener('click', () => {
            this.showGamesList();
        });
    }

    loadGamesFromMemory() {
        const gamesList = document.querySelector('.games-list');
        gamesList.innerHTML = '';

        // Convert games Map to array and sort by date
        const sortedGames = Array.from(this.games.keys())
            .sort((a, b) => {
                try {
                    const dateA = this.parseFolderDate(a);
                    const dateB = this.parseFolderDate(b);
                    return dateB - dateA;
                } catch (e) {
                    return 0;
                }
            });

        sortedGames.forEach(gameId => {
            const gameItem = this.createGameItem(gameId);
            if (gameItem) gamesList.appendChild(gameItem);
        });
    }

    createGameItem(gameId) {
        try {
            const date = this.parseFolderDate(gameId);
            
            const gameItem = document.createElement('div');
            gameItem.className = 'game-item';
            
            const formattedDate = date.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            });

            const formattedTime = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            gameItem.innerHTML = `
                <div class="game-item-date">
                    <div class="date">${formattedDate}</div>
                    <div class="time">${formattedTime}</div>
                </div>
            `;
            
            gameItem.addEventListener('click', () => this.loadGameDetails(gameId));
            return gameItem;
        } catch (e) {
            console.error("Error creating game item:", e);
            return null;
        }
    }

    loadGameDetails(gameId) {
        document.querySelector('.games-list').style.display = 'none';
        document.querySelector('.game-details').style.display = 'block';
        
        const gameData = this.games.get(gameId);
        if (!gameData) return;

        const container = document.getElementById('game_data');
        container.innerHTML = '';

        // Display each CSV file's data
        Object.entries(gameData).forEach(([dataType, csvContent]) => {
            const section = document.createElement('div');
            section.className = 'data-section';
            section.innerHTML = `<h3>${dataType}</h3>`;
            
            const table = this.createTableFromCSV(csvContent);
            section.appendChild(table);
            container.appendChild(section);
        });
    }

    showGamesList() {
        document.querySelector('.games-list').style.display = 'flex';
        document.querySelector('.game-details').style.display = 'none';
    }

    createTableFromCSV(csvContent) {
        const rows = csvContent.trim().split('\n');
        const headers = rows[0].split(',');
        
        const table = document.createElement('table');
        table.className = 'data-table';
        
        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create body
        const tbody = document.createElement('tbody');
        rows.slice(1).forEach(row => {
            if (row.trim()) {
                const tr = document.createElement('tr');
                row.split(',').forEach(cell => {
                    const td = document.createElement('td');
                    td.textContent = cell;
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            }
        });
        table.appendChild(tbody);
        
        return table;
    }

    parseFolderDate(folderPath) {
        const folderName = folderPath.split('\\').pop() || folderPath;
        const timestamp = folderName.split('_')[0];
        
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/.test(timestamp)) {
            throw new Error(`Invalid timestamp format: ${timestamp}`);
        }

        const dateString = timestamp.replace(
            /(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/,
            '$1T$2:$3:$4.$5Z'
        );
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            throw new Error("Invalid date");
        }
        
        return date;
    }
}

// Initialize dashboard when window loads
window.addEventListener('load', () => {
    window.dashboardManager = new DashboardManager();
});