class PointTracker {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // 定义完整的路径连接
    this.path = [
      { 
        point: { x: 100, y: 50 }, 
        number: 1,
        pathPoints: [
          { x: 100, y: 50 },
          { x: 150, y: 30 },
          { x: 200, y: 50 },
          { x: 250, y: 50 }
        ]
      },
      { 
        point: { x: 250, y: 50 }, 
        number: 2,
        pathPoints: [
          { x: 250, y: 50 },
          { x: 280, y: 100 },
          { x: 250, y: 150 },
          { x: 250, y: 200 }
        ]
      },
      { 
        point: { x: 250, y: 200 }, 
        number: 3,
        pathPoints: [
          { x: 250, y: 200 },
          { x: 200, y: 250 },
          { x: 150, y: 200 },
          { x: 100, y: 200 }
        ]
      },
      { 
        point: { x: 100, y: 200 }, 
        number: 4,
        pathPoints: [
          { x: 100, y: 200 },
          { x: 80, y: 250 },
          { x: 100, y: 300 },
          { x: 100, y: 350 }
        ]
      },
      { 
        point: { x: 100, y: 350 }, 
        number: 5,
        pathPoints: [
          { x: 100, y: 350 },
          { x: 100, y: 350 }  // 添加重复点，确保至少有两个点
        ]
      }
    ];

    this.player = { 
      x: 100, 
      y: 50, 
      currentPointIndex: 0,
      targetPointIndex: null,
      pathProgress: 0,
      movingBackwards: false  // 新增：标记是否在倒退移动
    };

    this.visitedPoints = [0]; // 记录已访问的点索引
    this.isMoving = false;
    this.movementSpeed = 0.02; // 控制移动速度
    this.gameCompleted = false;

    this.setupCanvas();
    this.animate();
  }

  setupCanvas() {
    this.canvas.width = 350;
    this.canvas.height = 450;
    this.canvas.style.backgroundColor = '#F5A623';
    this.canvas.addEventListener('click', this.handleClick.bind(this));
  }

  // 计算插值点 - 增强版本
  interpolatePoint(t, points, reverse = false) {
    // 安全检查 1：检查 points 数组
    if (!points || !Array.isArray(points) || points.length === 0) {
      return { x: 0, y: 0 };
    }

    // 如果只有一个点，或者 t 已经达到或超过边界，直接返回相应的点
    if (points.length === 1) {
      return points[0];
    }
    
    if (!reverse && t >= 1) {
      return points[points.length - 1];
    }
    
    if (reverse && t <= 0) {
      return points[0];
    }

    // 根据方向调整 t 值
    let clampedT;
    if (reverse) {
      // 反向移动时，t 从 1 递减到 0
      clampedT = Math.max(0, Math.min(1 - t, 0.999));
    } else {
      // 正向移动时，t 从 0 递增到 1
      clampedT = Math.max(0, Math.min(t, 0.999));
    }

    const segments = points.length - 1;
    const segmentIndex = Math.min(Math.floor(clampedT * segments), segments - 1);
    const localT = (clampedT * segments) % 1;

    // 安全检查 2：确保我们能访问两个有效的点
    const start = points[segmentIndex];
    const end = points[segmentIndex + 1];

    // 安全检查 3：确保两个点都有 x 和 y 属性
    if (!start || !end || typeof start.x !== 'number' || typeof start.y !== 'number' || 
        typeof end.x !== 'number' || typeof end.y !== 'number') {
      return points.find(p => p && typeof p.x === 'number' && typeof p.y === 'number') || { x: 0, y: 0 };
    }

    return {
      x: start.x + (end.x - start.x) * localT,
      y: start.y + (end.y - start.y) * localT
    };
  }

  // 绘制连续路径
  drawConnectedPath() {
    this.ctx.beginPath();
    this.path.forEach((pathPoint, index) => {
      const points = pathPoint.pathPoints;
      
      if (points && points.length > 0) {  // 添加安全检查
        points.forEach((point, pIndex) => {
          if (point && typeof point.x === 'number' && typeof point.y === 'number') {  // 确保点有效
            if (pIndex === 0) {
              this.ctx.moveTo(point.x, point.y);
            } else {
              this.ctx.lineTo(point.x, point.y);
            }
          }
        });
      }
    });
    
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 15;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();
  }

  movePlayerAlongPath() {
    if (!this.isMoving) return;

    // 安全检查
    if (this.player.currentPointIndex === null || 
        this.player.targetPointIndex === null || 
        !this.path[this.player.currentPointIndex] || 
        !this.path[this.player.targetPointIndex]) {
      this.isMoving = false;
      return;
    }

    const currentPath = this.path[this.player.currentPointIndex];
    const targetPath = this.path[this.player.targetPointIndex];

    // 根据移动方向增加或减少路径进度
    if (this.player.movingBackwards) {
      this.player.pathProgress -= this.movementSpeed;
    } else {
      this.player.pathProgress += this.movementSpeed;
    }

    // 确保 pathProgress 在有效范围内
    if (!this.player.movingBackwards && this.player.pathProgress > 1) {
      this.player.pathProgress = 1;
    } else if (this.player.movingBackwards && this.player.pathProgress < 0) {
      this.player.pathProgress = 0;
    }

    // 获取当前路径上的位置
    const currentPathPoints = currentPath.pathPoints;
    if (!currentPathPoints || currentPathPoints.length === 0) {
      this.isMoving = false;
      return;
    }

    const currentPoint = this.interpolatePoint(
      this.player.pathProgress, 
      currentPathPoints,
      this.player.movingBackwards
    );

    // 更新玩家位置
    if (currentPoint) {
      this.player.x = currentPoint.x;
      this.player.y = currentPoint.y;
    }

    // 判断是否到达终点
    const reachedEnd = this.player.movingBackwards ? 
      (this.player.pathProgress <= 0) : 
      (this.player.pathProgress >= 1);
      
    if (reachedEnd) {
      // 移动到目标点
      if (targetPath && targetPath.point) {
        this.player.x = targetPath.point.x;
        this.player.y = targetPath.point.y;
        
        // 更新当前位置索引
        this.player.currentPointIndex = this.player.targetPointIndex;
        
        // 记录已访问点
        if (!this.visitedPoints.includes(this.player.currentPointIndex)) {
          this.visitedPoints.push(this.player.currentPointIndex);
          
          // 检查游戏是否完成
          if (this.visitedPoints.length === this.path.length && 
              this.player.currentPointIndex === this.path.length - 1) {
            this.gameCompleted = true;
          }
        }
      }
      
      this.player.targetPointIndex = null;
      this.isMoving = false;
      this.player.pathProgress = 0;
      this.player.movingBackwards = false;
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制连续路径
    this.drawConnectedPath();

    // 移动玩家
    this.movePlayerAlongPath();

    // 绘制点
    this.path.forEach((pathPoint, index) => {
      if (pathPoint && pathPoint.point) {
        const point = pathPoint.point;
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 25, 0, Math.PI * 2);
        
        // 根据点的状态设置不同颜色
        if (index === this.player.currentPointIndex) {
          // 当前点
          this.ctx.fillStyle = '#32CD32'; // 亮绿色
        } else if (this.visitedPoints.includes(index)) {
          // 已访问点
          this.ctx.fillStyle = '#87CEFA'; // 浅蓝色
        } else {
          // 未访问点
          this.ctx.fillStyle = '#FF0000'; // 红色
        }
        
        this.ctx.fill();
        
        // 绘制数字
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(pathPoint.number, point.x, point.y);
      }
    });

    // 绘制玩家
    this.ctx.beginPath();
    this.ctx.arc(this.player.x, this.player.y, 10, 0, Math.PI * 2);
    this.ctx.fillStyle = 'blue';
    this.ctx.fill();
    
    // 绘制当前位置和游戏状态提示
    this.ctx.fillStyle = 'black';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'start';
    this.ctx.fillText(`当前位置：${this.player.currentPointIndex + 1}`, 10, 20);
    
    // 游戏状态
    if (this.gameCompleted) {
      this.drawCompletionMessage();
    } else {
      this.ctx.fillText(`游戏提示：点击红色点前进，点击蓝色点后退`, 10, 40);
    }

    requestAnimationFrame(this.animate.bind(this));
  }
  
  // 绘制完成游戏的消息
  drawCompletionMessage() {
    // 半透明背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制完成消息
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('恭喜完成游戏！', this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    // 绘制重新开始按钮
    this.ctx.fillStyle = '#4CAF50';
    this.drawButton(this.canvas.width / 2, this.canvas.height / 2 + 30, 120, 40);
    
    this.ctx.fillStyle = 'white';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('重新开始', this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  // 绘制按钮
  drawButton(x, y, width, height) {
    const radius = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(x - width/2 + radius, y - height/2);
    this.ctx.lineTo(x + width/2 - radius, y - height/2);
    this.ctx.quadraticCurveTo(x + width/2, y - height/2, x + width/2, y - height/2 + radius);
    this.ctx.lineTo(x + width/2, y + height/2 - radius);
    this.ctx.quadraticCurveTo(x + width/2, y + height/2, x + width/2 - radius, y + height/2);
    this.ctx.lineTo(x - width/2 + radius, y + height/2);
    this.ctx.quadraticCurveTo(x - width/2, y + height/2, x - width/2, y + height/2 - radius);
    this.ctx.lineTo(x - width/2, y - height/2 + radius);
    this.ctx.quadraticCurveTo(x - width/2, y - height/2, x - width/2 + radius, y - height/2);
    this.ctx.closePath();
    this.ctx.fill();
  }

  handleClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 如果游戏已完成，检查是否点击了重新开始按钮
    if (this.gameCompleted) {
      const buttonX = this.canvas.width / 2;
      const buttonY = this.canvas.height / 2 + 30;
      const buttonWidth = 120;
      const buttonHeight = 40;
      
      if (x >= buttonX - buttonWidth/2 && 
          x <= buttonX + buttonWidth/2 && 
          y >= buttonY - buttonHeight/2 && 
          y <= buttonY + buttonHeight/2) {
        this.resetGame();
        return;
      }
    }
    
    if (this.isMoving) return; // 移动中不响应点击
    
    const clickedPoint = this.path.find(pathPoint => {
      if (!pathPoint || !pathPoint.point) return false;
      const point = pathPoint.point;
      return Math.sqrt((x - point.x)**2 + (y - point.y)**2) < 25;
    });

    if (!clickedPoint) return;

    const currentPointIndex = this.player.currentPointIndex;
    const clickedPointIndex = this.path.findIndex(p => p && p.number === clickedPoint.number);

    // 无效点击检查
    if (clickedPointIndex === -1 || clickedPointIndex === currentPointIndex) {
      return;
    }

    // 前进或后退逻辑
    if (clickedPointIndex > currentPointIndex) {
      // 前进：只能移动到下一个点
      if (clickedPointIndex === currentPointIndex + 1) {
        this.player.targetPointIndex = clickedPointIndex;
        this.player.movingBackwards = false;
        this.isMoving = true;
        this.player.pathProgress = 0;
      }
    } else {
      // 后退：可以移动到任何已访问过的点
      if (this.visitedPoints.includes(clickedPointIndex)) {
        this.player.targetPointIndex = clickedPointIndex;
        this.player.movingBackwards = true;
        this.isMoving = true;
        this.player.pathProgress = 0;
      }
    }
  }
  
  // 重置游戏
  resetGame() {
    // 重置玩家状态
    this.player = { 
      x: 100, 
      y: 50, 
      currentPointIndex: 0,
      targetPointIndex: null,
      pathProgress: 0,
      movingBackwards: false
    };
    
    // 重置游戏状态
    this.visitedPoints = [0];
    this.isMoving = false;
    this.gameCompleted = false;
  }
}

window.onload = () => {
  new PointTracker('gameCanvas');
};