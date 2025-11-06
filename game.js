class PointGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.points = [
      { x: 50, y: 50, radius: 20, number: 1 },
      { x: 150, y: 50, radius: 20, number: 2 },
      { x: 150, y: 150, radius: 20, number: 3 },
      { x: 50, y: 150, radius: 20, number: 4 },
      { x: 50, y: 250, radius: 20, number: 5 }
    ];
    this.currentPoint = 0;
    this.player = { x: 50, y: 50 };
    this.setupCanvas();
  }

  setupCanvas() {
    this.canvas.width = 250;
    this.canvas.height = 300;
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.drawGame();
  }

  drawGame() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制路径
    this.ctx.beginPath();
    this.ctx.moveTo(50, 50);
    this.ctx.lineTo(150, 50);
    this.ctx.lineTo(150, 150);
    this.ctx.lineTo(50, 150);
    this.ctx.lineTo(50, 250);
    this.ctx.strokeStyle = 'black';
    this.ctx.stroke();

    // 绘制点
    this.points.forEach(point => {
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = 'red';
      this.ctx.fill();
      
      this.ctx.fillStyle = 'white';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(point.number, point.x, point.y);
    });

    // 绘制玩家
    this.ctx.beginPath();
    this.ctx.arc(this.player.x, this.player.y, 10, 0, Math.PI * 2);
    this.ctx.fillStyle = 'blue';
    this.ctx.fill();
  }

  handleClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedPoint = this.points.find(point => 
      Math.sqrt((x - point.x)**2 + (y - point.y)**2) < point.radius
    );

    if (clickedPoint && clickedPoint.number === this.points[this.currentPoint].number + 1) {
      this.player.x = clickedPoint.x;
      this.player.y = clickedPoint.y;
      this.currentPoint++;
      this.drawGame();

      if (this.currentPoint === this.points.length) {
        alert('游戏完成！');
      }
    }
  }
}

window.onload = () => {
  new PointGame('gameCanvas');
};