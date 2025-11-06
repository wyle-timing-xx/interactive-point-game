class PointTracker {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // 定义更加精确的路径连接
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
          { x: 100, y: 350 }
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

  // 计算插值点
  interpolatePoint(t, points) {
    // 如果只有一个点，直接返回
    if (points.length <= 1) return points[0];

    // 在相邻点之间插值
    const segments = points.length - 1;
    const segmentIndex = Math.floor(t * segments);
    const localT = (t * segments) % 1;

    const start = points[segmentIndex];
    const end = points[segmentIndex + 1];

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
      
      // 绘制路径
      points.forEach((point, pIndex) => {
        if (pIndex === 0) {
          this.ctx.moveTo(point.x, point.y);
        } else {
          this.ctx.lineTo(point.x, point.y);
        }
      });
    });
    
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 15;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();
  }

  movePlayerAlongPath() {
    if (!this.isMoving) return;

    // 获取当前路径点和目标路径点
    const currentPath = this.path[this.player.currentPointIndex];
    const targetPath = this.path[this.player.targetPointIndex];

    // 增加路径进度
    this.player.pathProgress += 0.02; // 控制移动速度

    // 获取当前路径上的位置
    const currentPathPoints = currentPath.pathPoints;
    const currentPoint = this.interpolatePoint(
      this.player.pathProgress, 
      currentPathPoints
    );

    // 更新玩家位置
    this.player.x = currentPoint.x;
    this.player.y = currentPoint.y;

    // 判断是否到达终点
    if (this.player.pathProgress >= 1) {
      // 移动到目标点
      this.player.x = targetPath.point.x;
      this.player.y = targetPath.point.y;
      this.player.currentPointIndex = this.player.targetPointIndex;
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
      const point = pathPoint.point;
      return Math.sqrt((x - point.x)**2 + (y - point.y)**2) < 25;
    });

    if (clickedPoint && !this.isMoving) {
      // 只能点击下一个顺序的点
      if (clickedPoint.number === this.path[this.player.currentPointIndex].number + 1) {
        this.player.targetPointIndex = this.path.findIndex(p => p.number === clickedPoint.number);
        this.isMoving = true;
        this.player.pathProgress = 0;
      }
    }
  }
}

window.onload = () => {
  new PointTracker('gameCanvas');
};