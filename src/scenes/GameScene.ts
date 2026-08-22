import Phaser from 'phaser';
import { Bullet } from '../game/Bullet';

export class GameScene extends Phaser.Scene {
  private readonly width = 1280;
  private readonly height = 720;
  private readonly playerSpeed = 15;
  private readonly enemySpeed = 5;
  private readonly timeLimit = 30;
  private readonly enemyCount = 5;
  private readonly enemySize = 42;
  private readonly playerBulletLimit = 5;

  private player!: Phaser.GameObjects.Rectangle;
  private playerBullets: Bullet[] = [];
  private enemies: Phaser.GameObjects.Rectangle[] = [];
  private enemyDirections: number[] = [];
  private enemyFireTimers: Array<Phaser.Time.TimerEvent | null> = [];
  private enemyBullets: Bullet[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private overlayText!: Phaser.GameObjects.Text;
  private resultTitleText!: Phaser.GameObjects.Text;
  private remainingTime = this.timeLimit;
  private score = 0;
  private isPaused = false;
  private isGameOver = false;
  private elapsedTime = 0;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.score = 0;
    this.remainingTime = this.timeLimit;
    this.isPaused = false;
    this.isGameOver = false;
    this.elapsedTime = 0;
    this.time.paused = false;
    this.physics.world.resume();

    this.add.rectangle(0, 0, this.width, this.height, 0x071426).setOrigin(0);

    this.enemyBullets = [];
    this.playerBullets = [];
    this.spawnEnemies();

    this.player = this.add.rectangle(640, 600, 42, 42, 0x4cc9f0);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard!.addCapture([
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.ESC,
    ]);

    this.scoreText = this.add.text(this.width - 24, 24, 'SCORE: 0', {
      fontFamily: 'sans-serif',
      fontSize: '24px',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { left: 10, right: 10, top: 6, bottom: 6 },
    }).setOrigin(1, 0);
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.registry.set('score', this.score);
    this.timerText = this.add.text(24, 24, `TIME: ${this.timeLimit}`, {
      fontFamily: 'sans-serif',
      fontSize: '24px',
      color: '#ffffff',
    });
    this.overlayText = this.add.text(this.width / 2, this.height / 2, '', {
      fontFamily: 'sans-serif',
      fontSize: '48px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5).setDepth(1);
    this.resultTitleText = this.add.text(this.width / 2, this.height / 2 - 70, '', {
      fontFamily: 'sans-serif',
      fontSize: '48px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5).setDepth(1);

    const escapeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escapeKey.on('down', () => {
      if (!this.isGameOver) {
        this.togglePause();
      }
    });
  }

  private spawnEnemies(): void {
    this.enemies = [];
    this.enemyDirections = [];
    this.enemyFireTimers = [];
    for (let index = 0; index < this.enemyCount; index += 1) {
      const enemy = this.add.rectangle(
        Phaser.Math.Between(this.enemySize / 2, this.width - this.enemySize / 2),
        50,
        this.enemySize,
        this.enemySize,
        0xfca311,
      );
      this.enemies.push(enemy);
      this.enemyDirections.push(Phaser.Math.Between(0, 1) === 0 ? -1 : 1);
      this.enemyFireTimers.push(null);
      this.scheduleEnemyFire(index);
    }
  }

  update(_time: number, delta: number): void {
    if (this.isPaused || this.isGameOver) {
      return;
    }

    this.movePlayer();
    this.firePlayerBullet();
    this.movePlayerBullet();
    this.moveEnemies();
    this.moveEnemyBullets();
    this.checkPlayerBulletHits();
    this.checkEnemyCollisions();
    this.elapsedTime += delta;
    if (this.elapsedTime >= 1000) {
      this.elapsedTime -= 1000;
      this.remainingTime -= 1;
      this.timerText.setText(`TIME: ${Math.max(0, this.remainingTime)}`);

      if (this.remainingTime <= 0) {
          this.finishGame('GAME CLEAR');
      }
    }
  }

  private movePlayer(): void {
    let horizontal = 0;
    let vertical = 0;

    if (this.cursors.left.isDown) horizontal -= 1;
    if (this.cursors.right.isDown) horizontal += 1;
    if (this.cursors.up.isDown) vertical -= 1;
    if (this.cursors.down.isDown) vertical += 1;

    this.player.x = Phaser.Math.Clamp(this.player.x + horizontal * this.playerSpeed, 21, this.width - 21);
    this.player.y = Phaser.Math.Clamp(this.player.y + vertical * this.playerSpeed, 21, this.height - 21);
  }

  private firePlayerBullet(): void {
    if (!Phaser.Input.Keyboard.JustDown(this.cursors.space)
      || this.playerBullets.length >= this.playerBulletLimit) {
      return;
    }

    this.playerBullets.push(new Bullet(this, this.player.x, this.player.y - 31, -1, 0xf72585));
  }

  private movePlayerBullet(): void {
    for (let index = this.playerBullets.length - 1; index >= 0; index -= 1) {
      const bullet = this.playerBullets[index];
      bullet.move();
      if (bullet.y < -20) {
        bullet.destroy();
        this.playerBullets.splice(index, 1);
      }
    }
  }

  private moveEnemies(): void {
    for (let index = 0; index < this.enemies.length; index += 1) {
      const enemy = this.enemies[index];
      if (!enemy.active) {
        continue;
      }

      enemy.x += this.enemyDirections[index] * this.enemySpeed;
      const halfSize = this.enemySize / 2;
      if (enemy.x <= halfSize || enemy.x >= this.width - halfSize) {
        enemy.x = Phaser.Math.Clamp(enemy.x, halfSize, this.width - halfSize);
        this.enemyDirections[index] *= -1;
      }
    }

    for (let firstIndex = 0; firstIndex < this.enemies.length; firstIndex += 1) {
      const firstEnemy = this.enemies[firstIndex];
      if (!firstEnemy.active) {
        continue;
      }

      for (let secondIndex = firstIndex + 1; secondIndex < this.enemies.length; secondIndex += 1) {
        const secondEnemy = this.enemies[secondIndex];
        if (!secondEnemy.active || !this.overlaps(firstEnemy, secondEnemy)) {
          continue;
        }

        const direction = firstEnemy.x <= secondEnemy.x ? 1 : -1;
        const separation = (this.enemySize - Math.abs(firstEnemy.x - secondEnemy.x)) / 2;
        firstEnemy.x -= direction * separation;
        secondEnemy.x += direction * separation;
        this.enemyDirections[firstIndex] = direction === 1 ? -1 : 1;
        this.enemyDirections[secondIndex] = direction === 1 ? 1 : -1;
      }
    }
  }

  private scheduleEnemyFire(index: number): void {
    this.enemyFireTimers[index]?.remove();
    this.enemyFireTimers[index] = this.time.delayedCall(
      Phaser.Math.Between(1000, 4000),
      () => {
        const enemy = this.enemies[index];
        if (enemy?.active) {
          this.enemyBullets.push(new Bullet(this, enemy.x, enemy.y + 31, 1, 0x90be6d));
        }
        this.scheduleEnemyFire(index);
      },
    );
  }

  private moveEnemyBullets(): void {
    for (let index = this.enemyBullets.length - 1; index >= 0; index -= 1) {
      const bullet = this.enemyBullets[index];
      bullet.move();

      if (bullet.y > this.height + 10) {
        bullet.destroy();
        this.enemyBullets.splice(index, 1);
      } else if (this.overlaps(bullet, this.player)) {
        bullet.destroy();
        this.enemyBullets.splice(index, 1);
          this.finishGame('GAME OVER');
        return;
      }
    }
  }

  private checkPlayerBulletHits(): void {
    for (let bulletIndex = this.playerBullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) {
      const bullet = this.playerBullets[bulletIndex];
      for (let enemyIndex = 0; enemyIndex < this.enemies.length; enemyIndex += 1) {
        const enemy = this.enemies[enemyIndex];
        if (enemy.active && this.overlaps(bullet, enemy)) {
          bullet.destroy();
          this.playerBullets.splice(bulletIndex, 1);
          this.destroyEnemy(enemyIndex);
          this.score += 100;
          this.scoreText.setText(`SCORE: ${this.score}`);
          this.registry.set('score', this.score);
          if (this.enemies.every((remainingEnemy) => !remainingEnemy.active)) {
            this.spawnEnemies();
          }
          break;
        }
      }
    }
  }

  private destroyEnemy(index: number): void {
    const enemy = this.enemies[index];
    this.enemyFireTimers[index]?.remove();
    this.enemyFireTimers[index] = null;
    enemy.destroy();
  }

  private checkEnemyCollisions(): void {
    for (const enemy of this.enemies) {
      if (enemy.active && this.overlaps(enemy, this.player)) {
          this.finishGame('GAME OVER');
        return;
      }
    }
  }

  private overlaps(first: Phaser.GameObjects.Rectangle, second: Phaser.GameObjects.Rectangle): boolean {
    return Math.abs(first.x - second.x) < (first.width + second.width) / 2
      && Math.abs(first.y - second.y) < (first.height + second.height) / 2;
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    this.time.paused = this.isPaused;
    if (this.isPaused) {
      this.physics.world.pause();
    } else {
      this.physics.world.resume();
    }
    this.overlayText.setText(this.isPaused ? 'PAUSED\nESC で再開' : '');
  }

  private finishGame(message: string): void {
    this.isGameOver = true;
    this.resultTitleText
      .setText(message)
      .setColor(message === 'GAME OVER' ? '#ff0000' : '#ffff00');
    this.overlayText.setText(`SCORE: ${this.score}\nENTER でタイトルへ`);
    const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    enterKey.once('down', () => {
      this.scene.start('TitleScene');
    });
  }
}
