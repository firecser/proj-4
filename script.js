// 游戏配置
const GRID_SIZE = 20;
const TILE_COUNT = 20;
const INITIAL_SPEED = 200;
const COMBO_TIME_THRESHOLD = 3000;
const BONUS_INTERVAL = 10000;

// 游戏状态
let snake = [{ x: 10, y: 10 }];
let food = { x: 5, y: 5, type: 'normal' };
let direction = { x: 0, y: 0 };
let score = 0;
let gameActive = true;
let speed = INITIAL_SPEED;
let speedEffectEndTime = 0;
let scoreMultiplier = 1;
let comboCount = 0;
let lastFoodTime = 0;
let obstacles = [];
let achievements = [];
let currentStage = 1;
let redFoodBonus = 0;
let lastBonusTime = Date.now();

// DOM 元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const redFoodScoreElement = document.getElementById('redFoodScore');
const achievementList = document.getElementById('achievementList');
const scorePopup = document.getElementById('scorePopup');

// 获取摇杆元素
const joystick = document.getElementById('joystick');
const joystickHandle = document.getElementById('joystickHandle');

// 摇杆状态
let joystickActive = false;
let joystickCenter = { x: 0, y: 0 };
let joystickRadius = 50; // 摇杆半径

// 初始化游戏
function initGame() {
    placeFood();
    updateAchievementList();
    gameLoop();
}

// 游戏主循环
function gameLoop() {
    if (!gameActive) return;

    update();
    draw();
    setTimeout(gameLoop, getCurrentSpeed());
}

// 更新游戏状态
function update() {
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    if (isCollision(head)) {
        resetGame();
        return;
    }

    snake.unshift(head);

    if (isFoodEaten(head)) {
        handleFoodEffect();
        placeFood();
        if (score % 20 === 0) placeObstacle();
    } else {
        snake.pop();
    }

    updateBonus();
    checkAchievements();
}

// 绘制游戏画面
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSnake();
    drawFood();
    drawObstacles();
    drawScore();
}

// 处理食物效果
function handleFoodEffect() {
    updateCombo();
    const scoreToAdd = calculateScore();
    score += scoreToAdd;
    showScorePopup(`+${scoreToAdd} 分`);
}

// 重置游戏状态
function resetGame() {
    snake = [{ x: 10, y: 10 }];
    direction = { x: 0, y: 0 };
    score = 0;
    speed = INITIAL_SPEED;
    speedEffectEndTime = 0;
    scoreMultiplier = 1;
    redFoodBonus = 0;
    lastBonusTime = Date.now();
    placeFood();
}

// 检查碰撞
function isCollision(head) {
    return head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT ||
        snake.some(segment => segment.x === head.x && segment.y === head.y) ||
        obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y);
}

// 检查是否吃到食物
function isFoodEaten(head) {
    return head.x === food.x && head.y === food.y;
}

// 更新连击
function updateCombo() {
    const currentTime = Date.now();
    comboCount = (currentTime - lastFoodTime < COMBO_TIME_THRESHOLD) ? comboCount + 1 : 1;
    lastFoodTime = currentTime;
}

// 计算分数
function calculateScore() {
    let scoreToAdd = 1 * scoreMultiplier * comboCount;
    if (food.type === 'normal') scoreToAdd += redFoodBonus;
    return scoreToAdd;
}

// 更新额外分数
function updateBonus() {
    if (Date.now() - lastBonusTime >= BONUS_INTERVAL) {
        redFoodBonus++;
        lastBonusTime = Date.now();
        updateRedFoodScore();
    }
}

// 更新普通食物分数显示
function updateRedFoodScore() {
    redFoodScoreElement.textContent = 1 + redFoodBonus;
}

// 显示飘字提示
function showScorePopup(text) {
    scorePopup.textContent = text;
    scorePopup.classList.add('show');
    setTimeout(() => scorePopup.classList.remove('show'), 3000);
}

// 检查成就
function checkAchievements() {
    const requiredScore = Math.pow(2, currentStage);
    if (score >= requiredScore && !achievements.includes(`stage${currentStage}`)) {
        achievements.push(`stage${currentStage}`);
        showScorePopup(`成就解锁：获得 ${requiredScore} 分！`);
        currentStage++;
        updateAchievementList();
    }
}

// 更新成就列表
function updateAchievementList() {
    achievementList.innerHTML = '';
    const nextStageLi = document.createElement('li');
    nextStageLi.textContent = `下一阶段：获得 ${Math.pow(2, currentStage)} 分`;
    achievementList.appendChild(nextStageLi);

    achievements.slice(-3).reverse().forEach((achievement, index) => {
        const li = document.createElement('li');
        li.textContent = `阶段 ${currentStage - index - 1}：获得 ${Math.pow(2, currentStage - index - 1)} 分`;
        achievementList.appendChild(li);
    });
}

// 绘制蛇
function drawSnake() {
    ctx.fillStyle = 'green';
    snake.forEach(segment => ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE));
}

// 绘制食物
function drawFood() {
    ctx.fillStyle = getFoodColor(food.type);
    ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
}

// 绘制障碍物
function drawObstacles() {
    ctx.fillStyle = 'black';
    obstacles.forEach(obstacle => ctx.fillRect(obstacle.x * GRID_SIZE, obstacle.y * GRID_SIZE, GRID_SIZE, GRID_SIZE));
}

// 绘制分数
function drawScore() {
    ctx.fillStyle = 'black';
    ctx.fillText(`分数: ${score}`, 10, 20);
}

// 获取食物颜色
function getFoodColor(type) {
    switch (type) {
        case 'normal': return 'red';
        case 'speedUp': return 'blue';
        case 'speedDown': return 'yellow';
        case 'doubleScore': return 'purple';
    }
}

// 放置新食物
function placeFood() {
    const foodTypes = ['normal', 'speedUp', 'speedDown', 'doubleScore'];
    const randomType = foodTypes[Math.floor(Math.random() * foodTypes.length)];
    food = {
        x: Math.floor(Math.random() * TILE_COUNT),
        y: Math.floor(Math.random() * TILE_COUNT),
        type: randomType
    };
}

// 放置障碍物
function placeObstacle() {
    const obstacle = {
        x: Math.floor(Math.random() * TILE_COUNT),
        y: Math.floor(Math.random() * TILE_COUNT)
    };
    obstacles.push(obstacle);
}

// 监听鼠标按下事件
document.addEventListener('mousedown', event => {
    joystickActive = true;
    joystick.style.display = 'flex';
    joystickCenter = { x: event.clientX, y: event.clientY };
    joystick.style.left = `${joystickCenter.x - joystickRadius}px`;
    joystick.style.top = `${joystickCenter.y - joystickRadius}px`;
    updateJoystick(event);
});

// 监听鼠标移动事件
document.addEventListener('mousemove', event => {
    if (joystickActive) {
        updateJoystick(event);
    }
});

// 监听鼠标松开事件
document.addEventListener('mouseup', () => {
    joystickActive = false;
    joystick.style.display = 'none';
    joystickHandle.style.transform = 'translate(0, 0)';
    direction = { x: 0, y: 0 }; // 松开摇杆时，蛇停止移动
});

// 更新摇杆位置
function updateJoystick(event) {
    const dx = event.clientX - joystickCenter.x;
    const dy = event.clientY - joystickCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // 限制摇杆手柄在摇杆范围内
    const handleX = Math.min(joystickRadius, Math.max(-joystickRadius, dx));
    const handleY = Math.min(joystickRadius, Math.max(-joystickRadius, dy));
    joystickHandle.style.transform = `translate(${handleX}px, ${handleY}px)`;

    // 根据摇杆位置设置蛇的移动方向
    if (distance > 10) {
        direction.x = Math.cos(angle);
        direction.y = Math.sin(angle);
    } else {
        direction = { x: 0, y: 0 };
    }
}

// 获取当前速度
function getCurrentSpeed() {
    if (Date.now() < speedEffectEndTime) {
        return speed / 2; // 如果加速效果未结束，速度加倍
    }
    return speed;
}

// 初始化游戏
initGame();