class PointGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // 定义带有控制点的精确路径
    this.path = [
      { point: { x: 100, y: 50 }, controlPoint: { x: 150, y: 20 } },
      { point: { x: 250, y: 50 }, controlPoint: { x: 200, y: 100 } },
      { point: { x: 250, y: 200 }, controlPoint: { x: 300, y: 150 } },
      { point: { x: 100, y: 200 }, controlPoint: { x: 180, y: 250 } },
      { point: { x: 100, y: 350 }, controlPoint: { x: 50, y: 300 } }
    ];

    this.points = this.path.map((p, index) => ({
      x: p.point.x, 
      y: p.point.y, 
      radius: 25, 
      number: index + 1
    }));

    this.player = { 
      x: 100, 
      y: 50, 
      currentSegment: 0,
      progress: 0 
    };

    this.order = 'asc';
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

  // 计算二次贝塞尔曲线上的点
  getQuadraticBezierPoint(t, p0, p1, p2) {
    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
    return { x, y };
  }

  // 绘制曲线路径
  drawCurvedPath() {
    this.ctx.beginPath();
    this.ctx.moveTo(this.path[0].point.x, this.path[0].point.y);
    
    for (let i = 0; i < this.path.length - 1; i++) {
      const start = this.path[i].point;
      const end = this.path[i + 1].point;
      const controlPoint = this.path[i].controlPoint;
      
      this.ctx.quadraticCurveTo(
        controlPoint.x, 
        controlPoint.y, 
        end.x, 
        end.y
      );
    }
    
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 15;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();
  }

  movePlayerAlongPath() {
    if (!this.isMoving) return;

    // 当前路径段的起点、控制点和终点
    const currentSeg = this.path[this.player.currentSegment];
    const nextSeg = this.path[this.player.currentSegment + 1];

    // 增加进度
    this.player.progress += 0.02; // 调整这个值控制移动速度

    // 计算当前位置
    const currentPoint = this.getQuadraticBezierPoint(
      this.player.progress, 
      currentSeg.point, 
      currentSeg.controlPoint, 
      nextSeg.point
    );

    this.player.x = currentPoint.x;
    this.player.y = currentPoint.y;

    // 如果到达路径段末尾
    if (this.player.progress >= 1) {
      this.player.currentSegment++;
      this.player.progress = 0;

      // 如果到达最后一个路径段
      if (this.player.currentSegment >= this.path.length - 1) {
        this.isMoving = false;
        alert(`游戏完成！最终顺序：${this.order}`);
      }
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制曲线路径
    this.drawCurvedPath();

    // 移动玩家
    this.movePlayerAlongPath();

    // 绘制点
    this.points.forEach(point => {
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FF0000';
      this.ctx.fill();
      
      this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(point.number, point.x, point.y);
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

    const clickedPoint = this.points.find(point => 
      Math.sqrt((x - point.x)**2 + (y - point.y)**2) < point.radius
    );

    if (clickedPoint && !this.isMoving) {
      // 确定下一个点的索引
      let nextPointIndex;
      if (this.order === 'asc') {
        nextPointIndex = this.points.findIndex(p => p.number === clickedPoint.number);
      } else {
        nextPointIndex = this.points.length - 1 - this.points.findIndex(p => p.number === clickedPoint.number);
      }

      // 如果点击的点在当前点之前或之后，则移动
      if (Math.abs(nextPointIndex - this.player.currentSegment) === 1) {
        this.isMoving = true;
        this.player.currentSegment = nextPointIndex;
        this.player.progress = 0;

        // 切换顺序
        this.order = this.order === 'asc' ? 'desc' : 'asc';
      }
    }
  }
}

window.onload = () => {
  new PointGame('gameCanvas');
};