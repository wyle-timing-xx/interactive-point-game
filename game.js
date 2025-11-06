class PointGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.points = [
      { x: 100, y: 50, radius: 25, number: 1 },
      { x: 250, y: 50, radius: 25, number: 2 },
      { x: 250, y: 200, radius: 25, number: 3 },
      { x: 100, y: 200, radius: 25, number: 4 },
      { x: 100, y: 350, radius: 25, number: 5 }
    ];
    this.currentPointIndex = 0;
    this.player = { x: 100, y: 50, targetX: 100, targetY: 50 };
    this.isMoving = false;
    this.moveSpeed = 2;
    this.order = 'asc'; // 默认正序

    this.setupCanvas();
    this.animate();
  }

  setupCanvas() {
    this.canvas.width = 350;
    this.canvas.height = 450;
    this.canvas.style.backgroundColor = '#F5A623';
    this.canvas.addEventListener('click', this.handleClick.bind(this));
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制弯曲路径
    this.ctx.beginPath();
    this.ctx.moveTo(100, 50);
    this.ctx.lineTo(250, 50);
    this.ctx.lineTo(250, 200);
    this.ctx.lineTo(100, 200);
    this.ctx.lineTo(100, 350);
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 15;
    this.ctx.stroke();

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

    // 平滑移动玩家
    if (this.isMoving) {
      const dx = this.player.targetX - this.player.x;
      const dy = this.player.targetY - this.player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.moveSpeed) {
        this.player.x = this.player.targetX;
        this.player.y = this.player.targetY;
        this.isMoving = false;
      } else {
        const angle = Math.atan2(dy, dx);
        this.player.x += this.moveSpeed * Math.cos(angle);
        this.player.y += this.moveSpeed * Math.sin(angle);
      }
    }

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
      if (Math.abs(nextPointIndex - this.currentPointIndex) === 1) {
        this.player.targetX = clickedPoint.x;
        this.player.targetY = clickedPoint.y;
        this.isMoving = true;
        this.currentPointIndex = nextPointIndex;

        // 切换顺序
        this.order = this.order === 'asc' ? 'desc' : 'asc';

        if (this.currentPointIndex === 0 || this.currentPointIndex === this.points.length - 1) {
          alert(`游戏完成！最终顺序：${this.order}`);
        }
      }
    }
  }
}

window.onload = () => {
  new PointGame('gameCanvas');
};