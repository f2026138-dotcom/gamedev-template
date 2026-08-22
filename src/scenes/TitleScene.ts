import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  private readonly width = 1280;
  private readonly height = 720;

  constructor() {
    super('TitleScene');
  }

  create(): void {
    this.registry.set('score', 0);

    this.add.rectangle(0, 0, this.width, this.height, 0xd8f1f8).setOrigin(0);
    this.add.text(this.width / 2, 220, 'SPACE SHOOTER', {
      fontFamily: 'sans-serif',
      fontSize: '64px',
      color: '#14213d',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(this.width / 2, 330, '敵に球を当てて撃破しよう', {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      color: '#14213d',
    }).setOrigin(0.5);
    this.add.text(this.width / 2, 460, 'ENTER でスタート', {
      fontFamily: 'sans-serif',
      fontSize: '32px',
      color: '#000000',
    }).setOrigin(0.5);

    const enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    enterKey?.on('down', () => {
      this.scene.start('GameScene');
    });
  }
}
