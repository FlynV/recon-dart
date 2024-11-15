class DashboardManager {
    constructor() {
        this.games = new Map();
        this.fileHandler = new FileHandler(this);
        this.dataTypes = {
            'team_data': 'Team Data',
            'player_data': 'Player Data',
            'kills_timeline': 'Kills Timeline',
            'economy_data': 'Economy Data'
        };
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

        console.log('Loading games from memory:', this.games);

        // Convert games Map to array and sort by date
        const sortedGames = Array.from(this.games.keys())
            .sort((a, b) => {
                try {
                    const dateA = this.parseFolderDate(a);
                    const dateB = this.parseFolderDate(b);
                    return dateB - dateA;
                } catch (e) {
                    console.error('Error sorting games:', e);
                    return 0;
                }
            });

        console.log('Sorted games:', sortedGames);

        if (sortedGames.length === 0) {
            gamesList.innerHTML = '<div class="no-games">No games found</div>';
            document.querySelector('.upload-container').style.display = 'block';
            return;
        }

        sortedGames.forEach(gameId => {
            console.log('Creating game item for:', gameId);
            const gameItem = this.createGameItem(gameId);
            if (gameItem) {
                gamesList.appendChild(gameItem);
                console.log('Added game item to list');
            } else {
                console.error('Failed to create game item for:', gameId);
            }
        });

        // Hide upload container after successful load
        document.querySelector('.upload-container').style.display = 'none';
    }

    parseFolderDate(folderPath) {
        try {
            const folderName = folderPath.split('\\').pop() || folderPath;
            
            // Extract timestamp part (before the underscore)
            const timestamp = folderName.split('_')[0];
            
            if (!/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/.test(timestamp)) {
                throw new Error(`Invalid timestamp format: ${timestamp}`);
            }

            // Convert timestamp to date string
            const dateString = timestamp.replace(
                /(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/,
                '$1T$2:$3:$4.$5Z'
            );
            
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                throw new Error("Invalid date");
            }
            
            return date;
        } catch (e) {
            console.error("Error parsing date:", e);
            throw e;
        }
    }

    getMapName(folderPath) {
        const folderName = folderPath.split('\\').pop() || folderPath;
        return folderName.split('_')[1] || 'Unknown';
    }

    createGameItem(gameId) {
        try {
            const date = this.parseFolderDate(gameId);
            const mapName = this.getMapName(gameId);
            
            const gameItem = document.createElement('div');
            gameItem.className = 'game-item';
            gameItem.setAttribute('data-map', mapName);
            
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
                    <div class="map">${mapName}</div>
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
        document.querySelector('.upload-container').style.display = 'none';
        document.querySelector('.game-details').style.display = 'block';
        
        const container = document.getElementById('game_data');
        if (!container) {
            console.error('Game data container not found!');
            return;
        }

        const gameData = this.games.get(gameId);
        if (!gameData) {
            console.error('No game data found for:', gameId);
            return;
        }

        // Clear previous content
        container.innerHTML = '';

        // Add game header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'game-header';
        headerDiv.innerHTML = `
            <h2>${this.getMapName(gameId)}</h2>
            <p>${this.parseFolderDate(gameId).toLocaleString()}</p>
        `;
        container.appendChild(headerDiv);

        // Display each CSV file's data
        const dataOrder = ['team_data', 'player_data', 'kills_timeline', 'economy_data'];
        
        dataOrder.forEach(dataType => {
            if (gameData[dataType]) {
                const section = document.createElement('div');
                section.className = 'data-section';
                section.innerHTML = `<h3>${this.formatDataTypeName(dataType)}</h3>`;
                
                const table = this.createTableFromCSV(gameData[dataType]);
                section.appendChild(table);
                container.appendChild(section);
            }
        });
    }

    formatDataTypeName(dataType) {
        return this.dataTypes[dataType] || dataType.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    showGamesList() {
        document.querySelector('.games-list').style.display = 'flex';
        document.querySelector('.game-details').style.display = 'none';
        document.querySelector('.upload-container').style.display = 
            this.games.size === 0 ? 'block' : 'none';
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
            th.textContent = header.trim();
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
                    td.textContent = cell.trim();
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            }
        });
        table.appendChild(tbody);
        
        return table;
    }
}

// Initialize dashboard when window loads
window.addEventListener('load', () => {
    window.dashboardManager = new DashboardManager();
});