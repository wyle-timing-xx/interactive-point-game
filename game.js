class PointTracker {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // 定义带有控制点的精确路径
    this.path = [
      { point: { x: 100, y: 50 }, number: 1, controlPoints: [{ x: 150, y: 20 }, { x: 180, y: 30 }] },
      { point: { x: 250, y: 50 }, number: 2, controlPoints: [{ x: 200, y: 100 }, { x: 220, y: 80 }] },
      { point: { x: 250, y: 200 }, number: 3, controlPoints: [{ x: 300, y: 150 }, { x: 280, y: 170 }] },
      { point: { x: 100, y: 200 }, number: 4, controlPoints: [{ x: 180, y: 250 }, { x: 160, y: 230 }] },
      { point: { x: 100, y: 350 }, number: 5, controlPoints: [{ x: 50, y: 300 }, { x: 70, y: 320 }] }
    ];

    this.player = { 
      x: 100, 
      y: 50, 
      currentPoint: this.path[0],
      targetPoint: null,
      progress: 0 
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

  // 计算多点贝塞尔曲线上的点
  getBezierPoint(t, points) {
    if (points.length === 1) return points[0];
    const newPoints = [];
    for (let i = 0; i < points.length - 1; i++) {
      const x = points[i].x * (1 - t) + points[i + 1].x * t;
      const y = points[i].y * (1 - t) + points[i + 1].y * t;
      newPoints.push({ x, y });
    }
    return this.getBezierPoint(t, newPoints);
  }

  // 绘制曲线路径
  drawCurvedPath() {
    this.ctx.beginPath();
    this.ctx.moveTo(this.path[0].point.x, this.path[0].point.y);
    
    this.path.forEach((point, index) => {
      if (index < this.path.length - 1) {
        const start = point.point;
        const end = this.path[index + 1].point;
        const controlPoints = [start, ...point.controlPoints, end];
        
        // 绘制贝塞尔曲线
        this.ctx.lineTo(start.x, start.y);
      }
    });
    
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 15;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();
  }

  movePlayerAlongPath() {
    if (!this.isMoving || !this.player.targetPoint) return;

    // 获取起点和终点
    const startPoint = this.player.currentPoint.point;
    const endPoint = this.player.targetPoint.point;
    
    // 获取所有控制点
    const controlPoints = [
      startPoint, 
      ...this.player.currentPoint.controlPoints,
      ...this.player.targetPoint.controlPoints.slice(0, -1),
      endPoint
    ];

    // 增加进度
    this.player.progress += 0.03; // 调整这个值控制移动速度

    // 计算当前位置
    const currentPoint = this.getBezierPoint(
      this.player.progress, 
      controlPoints
    );

    this.player.x = currentPoint.x;
    this.player.y = currentPoint.y;

    // 如果到达路径末尾
    if (this.player.progress >= 1) {
      this.player.x = endPoint.x;
      this.player.y = endPoint.y;
      this.player.currentPoint = this.player.targetPoint;
      this.player.targetPoint = null;
      this.isMoving = false;
      this.player.progress = 0;
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制曲线路径
    this.drawCurvedPath();

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
      // 如果点击的不是当前点
      if (clickedPoint !== this.player.currentPoint) {
        this.player.targetPoint = clickedPoint;
        this.isMoving = true;
        this.player.progress = 0;
      }
    }
  }
}

window.onload = () => {
  new PointTracker('gameCanvas');
};