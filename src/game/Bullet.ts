import Phaser from 'phaser';

export class Bullet extends Phaser.GameObjects.Rectangle {
  private readonly direction: -1 | 1;
  private readonly speed = 17;

  constructor(scene: Phaser.Scene, x: number, y: number, direction: -1 | 1, color: number) {
    super(scene, x, y, 16, 40, color);
    this.direction = direction;
    scene.add.existing(this);
  }

  move(): void {
    this.y += this.direction * this.speed;
  }
}
