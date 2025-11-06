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
      pathProgress: 0
    };

    this.isMoving = false;

    this.setupCanvas();
    this.animate();
  }

  setupCanvas() {
    this.canvas.width = 350;
    this.canvas.height = 450;
    this.canvas.style.backgroundColor = '#F5A623';
    this.canvas.addEventListener('click', this.handleClick.bind(this));
  }

  // 计算插值点 - 修复版本
  interpolatePoint(t, points) {
    // 安全检查 1：检查 points 数组
    if (!points || !Array.isArray(points) || points.length === 0) {
      return { x: 0, y: 0 };
    }

    // 如果只有一个点，或者 t 已经达到或超过1，直接返回最后一个点
    if (points.length === 1 || t >= 1) {
      return points[points.length - 1];
    }

    // 确保 t 在 [0, 1] 范围内
    const clampedT = Math.max(0, Math.min(t, 0.999));
    const segments = points.length - 1;
    const segmentIndex = Math.min(Math.floor(clampedT * segments), segments - 1);
    const localT = (clampedT * segments) % 1;

    // 安全检查 2：确保我们能访问两个有效的点
    const start = points[segmentIndex];
    const end = points[segmentIndex + 1];

    // 安全检查 3：确保两个点都有 x 和 y 属性
    if (!start || !end || typeof start.x !== 'number' || typeof start.y !== 'number' || 
        typeof end.x !== 'number' || typeof end.y !== 'number') {
      // 返回一个默认点，或者数组中的第一个有效点
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

    // 增加路径进度
    this.player.pathProgress += 0.02; // 控制移动速度

    // 确保 pathProgress 不超过 1
    if (this.player.pathProgress > 1) {
      this.player.pathProgress = 1;
    }

    // 获取当前路径上的位置
    const currentPathPoints = currentPath.pathPoints;
    if (!currentPathPoints || currentPathPoints.length === 0) {
      this.isMoving = false;
      return;
    }

    const currentPoint = this.interpolatePoint(
      this.player.pathProgress, 
      currentPathPoints
    );

    // 更新玩家位置
    if (currentPoint) {
      this.player.x = currentPoint.x;
      this.player.y = currentPoint.y;
    }

    // 判断是否到达终点
    if (this.player.pathProgress >= 1) {
      // 移动到目标点
      if (targetPath && targetPath.point) {
        this.player.x = targetPath.point.x;
        this.player.y = targetPath.point.y;
        this.player.currentPointIndex = this.player.targetPointIndex;
      }
      this.player.targetPointIndex = null;
      this.isMoving = false;
      this.player.pathProgress = 0;
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制连续路径
    this.drawConnectedPath();

    // 移动玩家
    this.movePlayerAlongPath();

    // 绘制点
    this.path.forEach(pathPoint => {
      if (pathPoint && pathPoint.point) {  // 添加安全检查
        const point = pathPoint.point;
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 25, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fill();
        
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

    requestAnimationFrame(this.animate.bind(this));
  }

  handleClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedPoint = this.path.find(pathPoint => {
      if (!pathPoint || !pathPoint.point) return false;  // 添加安全检查
      const point = pathPoint.point;
      return Math.sqrt((x - point.x)**2 + (y - point.y)**2) < 25;
    });

    if (clickedPoint && !this.isMoving) {
      // 安全检查
      const currentPointIndex = this.player.currentPointIndex;
      const clickedPointIndex = this.path.findIndex(p => p && p.number === clickedPoint.number);

      // 检查点击的点是否有效并且在当前点之后
      if (clickedPointIndex !== -1 && clickedPointIndex > currentPointIndex) {
        this.player.targetPointIndex = clickedPointIndex;
        this.isMoving = true;
        this.player.pathProgress = 0;
      }
    }
  }
}

window.onload = () => {
  new PointTracker('gameCanvas');
};