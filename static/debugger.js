let requestHistory = [];

async function createSession() {
    const resultDiv = document.getElementById('sessionResult');
    
    try {
        const response = await fetch('/api/create_session', {
            method: 'POST'
        });

        const data = await response.json();
        logRequest('POST /api/create_session', response.status);
        
        if (data.session_id) {
            document.getElementById('sessionId').value = data.session_id;
            resultDiv.innerHTML = `<span style="color: #27ae60;">成功创建会话：${data.session_id}</span>`;
        } else {
            resultDiv.innerHTML = `<span style="color: #e74c3c;">错误：${data.error || '未知错误'}</span>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<span style="color: #e74c3c;">网络错误：${error.message}</span>`;
    }
}

async function sendMessage() {
    const sessionId = document.getElementById('sessionId').value;
    const message = document.getElementById('message').value;
    const resultDiv = document.getElementById('chatResult');

    if (!sessionId || !message) {
        resultDiv.innerHTML = '<span style="color: #e67e22;">请填写会话ID和消息内容</span>';
        return;
    }

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: sessionId,
                message: message
            })
        });

        const data = await response.json();
        logRequest('POST /api/chat', response.status);
        
        if (data.response) {
            resultDiv.innerHTML = `
                <div style="color: #27ae60;">AI回复：</div>
                <div style="margin-top: 10px;">${data.response}</div>
            `;
        } else {
            resultDiv.innerHTML = `<span style="color: #e74c3c;">错误：${data.error || '未知错误'}</span>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<span style="color: #e74c3c;">网络错误：${error.message}</span>`;
    }
}

function logRequest(endpoint, status) {
    const history = {
        time: new Date().toLocaleTimeString(),
        endpoint: endpoint,
        status: status,
        statusClass: status >= 400 ? 'error' : 'success'
    };

    requestHistory.unshift(history);
    updateHistoryTable();
}

function updateHistoryTable() {
    const tbody = document.querySelector('#historyTable tbody');
    tbody.innerHTML = requestHistory.map(item => `
        <tr class="${item.statusClass}">
            <td>${item.time}</td>
            <td>${item.endpoint}</td>
            <td><span class="status-badge">${item.status}</span></td>
            <td><button onclick="retryRequest('${item.endpoint}')">重试</button></td>
        </tr>
    `).join('');
}

// 添加样式到动态生成的元素
const style = document.createElement('style');
style.textContent = `
    .error { background: #fdeded; }
    .success { background: #edf7ed; }
    .status-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 10px;
        font-weight: bold;
    }
    .status-badge[data-status^="2"] { background: #27ae60; color: white; }
    .status-badge[data-status^="4"], 
    .status-badge[data-status^="5"] { background: #e74c3c; color: white; }
`;
document.head.appendChild(style);
