const TILES = {
  tile: "tile",
  tileE: "tileE",
  tileW: "tileW",
  tileP: "tileP",
  tileHP: "tileHP",
  tileSW: "tileSW",
  corridor: "corridor",
};

const ITEMS = {
  hero: TILES.tileP,
  sword: TILES.tileSW,
  enemy: TILES.tileE,
  healthPotion: TILES.tileHP,
};

const WALK_DIRECTIONS = {
  top: "top",
  bottom: "bottom",
  left: "left",
  right: "right",
};

class Game {
  constructor() {
    this.cols = 40;
    this.rows = 24;
    this.map = [];
    this.hero = this.createHero();
    this.enemies = [];
    this.rooms = [];
    this.healthPotions = [];
    this.swords = [];
  }

  createHero() {
    const hero = {
      x: 0,
      y: 0,
      damage: 30,
      health: 100,
    };
    return hero;
  }

  init() {
    // Определение ширины и высоты блока в зависимости от размеров поля
    const field = this.getField();
    const fieldW = field.clientWidth;
    const fieldH = field.clientHeight;
    this.pixelX = fieldW / this.cols;
    this.pixelY = fieldH / this.rows;

    this.generateMap();
    this.generateRooms(5, 10);
    this.generateCorridors();
    this.placeItems("sword", 2);
    this.placeItems("healthPotion", 10);
    this.placeHero();
    this.placeEnemies(10);
    this.bindEvents();

    console.log("done");
  }

  generateMap() {
    // Реализация генерации карты
    const field = this.getField();
    field.innerHTML = ""; // Очистим поле перед отображением

    for (let i = 0; i < this.rows; i++) {
      this.map[i] = [];
      for (let j = 0; j < this.cols; j++) {
        this.map[i][j] = TILES.tileW; // Заполняем всю карту стенами
        const tile = this.createBlock(this.map[i][j], j, i);
        field.appendChild(tile);
      }
    }

    console.log("Карта сгенерирована");
  }

  generateRooms(minRooms, maxRooms) {
    const numRooms = this.generateRandomNum(minRooms, maxRooms);

    for (let i = 0; i < numRooms; i++) {
      const roomWidth = this.generateRandomNum(3, 8);
      const roomHeight = this.generateRandomNum(3, 8);

      const room = {
        id: i + 1,
        x: 0,
        y: 0,
        width: roomWidth,
        height: roomHeight,
      };

      // Повторяем генерацию комнаты, пока она пересекается с другими комнатами
      do {
        room.x = this.getRandomCoordinates().x;
        room.y = this.getRandomCoordinates().y;
      } while (
        this.rooms.some((existingRoom) => this.roomsOverlap(existingRoom, room))
      );

      const blocks = document.querySelectorAll(".field div");
      for (let row = room.y; row < room.height + room.y; row++) {
        for (let col = room.x; col < room.width + room.x; col++) {
          const block = blocks[row * this.cols + col];
          this.map[row][col] = TILES.tile;
          block.className = this.map[row][col];
        }
      }

      // Добавляем комнату в массив
      this.rooms.push(room);
    }
    console.log("Комнаты сегенерированы");
  }

  // Проверка на пересечение комнат
  roomsOverlap(room1, room2) {
    return (
      room1.x < room2.x + room2.width + 1 &&
      room1.x + room1.width + 1 > room2.x &&
      room1.y < room2.y + room2.height + 1 &&
      room1.y + room1.height + 1 > room2.y
    );
  }

  getRandomCoordinates() {
    const x = Math.floor(Math.random() * (this.cols - 8));
    const y = Math.floor(Math.random() * (this.rows - 8));
    return { x, y };
  }

  generateCorridors() {
    // Проходим по всем комнатам и генерируем коридоры так,
    // чтобы они пересекали все комнаты

    // Генерация горизонтальных коридоров
    for (let roomI = 0; roomI < this.rooms.length; roomI++) {
      const { x, y, width, height } = this.rooms[roomI];

      // Проверка: пересекает ли данную комнату хотя бы 1 коридор
      let hasCorridor = false;
      for (let col = x; col <= x + width; col++) {
        if (this.map[y][col] === "corridor") {
          hasCorridor = true;
          break;
        }
      }

      for (let row = y; row <= y + height; row++) {
        if (this.map[row][x] === "corridor") {
          hasCorridor = true;
          break;
        }
      }

      if (!hasCorridor) {
        const randomRoomRow = this.generateRandomNum(y, y + height);
        // Рендер горизонтального коридора
        const blocks = document.querySelectorAll(".field div");
        for (let col = 0; col < this.cols; col++) {
          this.map[randomRoomRow][col] = "corridor";
          const blockIdx = randomRoomRow * this.cols + col;
          blocks[blockIdx].className = TILES.tile;
        }
      }
    }

    // Генерация вертикальных коридоров

    // Разбиение горизонтального отрезка на примерно одинаковые диапазоны
    const vCorridorCount = this.generateRandomNum(3, 5);
    const diapasons = Math.floor(this.cols / vCorridorCount);

    const blocks = document.querySelectorAll(".field div");
    let i = 0;
    do {
      // Выбор случайной колонки из диапазона
      const randomColInDiapason = this.generateRandomNum(
        i * diapasons,
        (i + 1) * diapasons - 1
      );

      // Отрисовка вертикального коридора
      for (let row = 0; row < this.rows; row++) {
        this.map[row][randomColInDiapason] = "corridor";
        const blockIdx = row * this.cols + randomColInDiapason;
        blocks[blockIdx].className = TILES.tile;
      }

      i++;
    } while (i < vCorridorCount);

    console.log("Коридоры сгенерированы");
  }

  // Размещение предметов
  placeItems(itemType, numItems) {
    const field = this.getField();
    for (let i = 0; i < numItems; i++) {
      let emptyCell = this.findEmptyCell();
      if (emptyCell) {
        const [x, y] = emptyCell;
        this.map[y][x] = ITEMS[itemType];

        // Добавление предметов в состояние в зависимости от типа
        switch (itemType) {
          case "sword": {
            const sword = {
              id: i + 1,
              damage: 30,
              x,
              y,
            };
            this.swords.push(sword);
            break;
          }
          case "healthPotion": {
            const healthPotion = {
              id: i + 1,
              healPoints: 30,
              x,
              y,
            };
            this.healthPotions.push(healthPotion);
            break;
          }
        }

        const itemBlock = this.createBlock(ITEMS[itemType], x, y);
        field.appendChild(itemBlock);
      }
    }
    console.log("Предметы сгенерированы:", itemType, numItems);
  }

  // Размещение героя
  placeHero() {
    let emptyCell = this.findEmptyCell();
    if (emptyCell) {
      const [x, y] = emptyCell;
      this.map[y][x] = TILES.tileP;
      this.hero.x = x;
      this.hero.y = y;

      const heroBlock = this.createBlock(TILES.tileP, x, y);

      const health = this.createHealthBlock();
      heroBlock.appendChild(health);

      const field = this.getField(heroBlock);
      field.appendChild(heroBlock);

      console.log("Герой размещен");
    }
  }

  // Размещение противников
  placeEnemies(numEnemies) {
    const field = this.getField();
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < numEnemies; i++) {
      const emptyCell = this.findEmptyCell();
      if (emptyCell) {
        const [x, y] = emptyCell;
        this.map[y][x] = TILES.tileE;

        const enemy = this.createEnemy(x, y);

        this.enemies.push(enemy);
        fragment.appendChild(enemy.block);
      }
    }

    field.appendChild(fragment);

    console.log("Враги размещены");
  }

  createEnemy(x, y) {
    const enemyBlock = this.createBlock(TILES.tileE, x, y);
    const health = this.createHealthBlock();
    enemyBlock.appendChild(health);

    return {
      id: this.enemies.length + 1,
      x,
      y,
      health: 100,
      damage: 20,
      block: enemyBlock,
      behaviorInterval: null,
      clearBehaviorInterval() {
        this.behaviorInterval && clearInterval(this.behaviorInterval);
      },
    };
  }

  bindEvents() {
    // Реализация привязки событий (клавиш, например)
    document.addEventListener("keydown", (event) => {
      event.preventDefault();
      if (this.hero.health <= 0) {
        return;
      }
      const key = event.key.toLowerCase();

      switch (key) {
        case "ц":
        case "w":
          this.moveHero(0, -1); // Вверх
          break;
        case "ф":
        case "a":
          this.moveHero(-1, 0); // Влево
          break;
        case "ы":
        case "s":
          this.moveHero(0, 1); // Внизw
          break;
        case "в":
        case "d":
          this.moveHero(1, 0); // Вправо
          break;
        case " ":
          this.attack();
          break;
      }
    });

    // циклическое поведение врагов
    const enemyBehaviorInterval = setInterval(() => {
      for (let i = 0; i < this.enemies.length; i++) {
        const enemy = this.enemies[i];
        if (this.isHeroNearby(enemy)) this.attackHeroByEnemy(enemy);
        else this.randomWalk(enemy);
      }
    }, 2000);

    console.log("События привязаны");
  }

  moveHero(xOffset, yOffset) {
    const { x, y } = this.hero;

    // debugger
    const newY = y + yOffset;
    const newX = x + xOffset;

    if (!this.isWalkableTile(newX, newY)) {
      console.log("Нельзя пройти");
      return;
    }

    let takeItemResult = null;
    const nextTile = this.map[newY][newX];
    switch (nextTile) {
      case TILES.tileSW:
        takeItemResult = this.takeSwordAt(newX, newY);
        break;
      case TILES.tileHP:
        if (this.hero.health < 100)
          takeItemResult = this.takeHealthPotionAt(newX, newY);
        break;
    }

    // удаление персонажа со старой позиции
    if (this.swords.some((sword) => sword.x === x && sword.y === y)) {
      this.map[y][x] = TILES.tileSW;
    }
    if (this.healthPotions.some((hp) => hp.x === x && hp.y === y)) {
      this.map[y][x] = TILES.tileHP;
    } else this.map[y][x] = TILES.tile;

    // this.map[y][x] = "tile";
    // blocks[y * this.cols + x].className = "tile";

    // добавление персонажа на новую позицию
    this.map[newY][newX] = TILES.tileP;
    this.hero.x = newX;
    this.hero.y = newY;
    const heroBlock = this.getHeroBlock();
    heroBlock.style.top = newY * this.pixelY + "px";
    heroBlock.style.left = newX * this.pixelX + "px";
  }

  takeSwordAt(x, y) {
    if (this.hero.damage >= 50) {
      return false;
    }

    const [sword, swordIdx] = this.getItemDataAt("swords", x, y);

    if (!sword) {
      console.log("sword not found");
      return false;
    }

    this.hero.damage += sword.damage;
    this.map[y][x] = TILES.tile;

    // удаление блока с мечом из DOM
    const swordBlock = document.querySelectorAll("." + TILES.tileSW)[swordIdx];
    swordBlock.remove();
    // удаление меча из состояния
    this.swords.filter((s) => s.id !== sword.id);
    return true;
  }

  takeHealthPotionAt(x, y) {
    if (this.hero.health === 100) return;

    // определение healthPotion и его индекса
    const [healthPotion, healthPotionIdx] = this.getItemDataAt(
      "healthPotions",
      x,
      y
    );

    if (!healthPotion) {
      console.log("healthPotion not found");
      return false;
    }

    if (this.hero.health + healthPotion.healPoints >= 100) {
      this.hero.health = 100;
    } else {
      this.hero.health += healthPotion.healPoints;
    }

    const heroBlock = this.getHeroBlock();
    const healthBlock = heroBlock.children[0];
    healthBlock.style.width = this.hero.health + "%";

    // удаление блока с зельем из DOM
    const healthPotionBlock = document.querySelectorAll("." + TILES.tileHP)[
      healthPotionIdx
    ];
    healthPotionBlock.remove();

    // удаление блока с зельем из состояния
    this.healthPotions = this.healthPotions.filter(
      (hp) => hp.id !== healthPotion.id
    );

    return true;
  }

  getItemDataAt(itemType, x, y) {
    let item = null;
    let itemIdx = 0; // индекс для удаления из DOM
    for (let i = 0; i < this[itemType].length; i++) {
      const it = this[itemType][i];
      if (it.x === x && it.y === y) {
        item = it;
        itemIdx = i;
        break;
      }
    }

    return [item, itemIdx];
  }

  getEnemyById(id) {
    return this.enemies.find((e) => e.id === id);
  }

  isHeroNearby(enemy) {
    const { x, y } = enemy;
    if (
      (y + 1 < this.rows && this.map[y + 1][x] === TILES.tileP) ||
      (y - 1 >= 0 && this.map[y - 1][x] === TILES.tileP) ||
      (x + 1 < this.cols && this.map[y][x + 1] === TILES.tileP) ||
      (x - 1 >= 0 && this.map[y][x - 1] === TILES.tileP)
    ) {
      return true;
    }

    return false;
  }

  attackHeroByEnemy(enemy) {
    const { damage } = enemy;

    const heroBlock = this.getHeroBlock();
    const heroHealthBlock = heroBlock.children[0];

    this.hero.health -= damage;
    if (this.hero.health <= 0) {
      heroHealthBlock.style.width = 0 + "px";
      heroBlock.classList.add("killed");
      return;
    }

    heroHealthBlock.style.width = this.hero.health + "%";
  }

  randomWalk(enemy) {
    const enemyBlock = this.getEnemyBlockById(enemy.id);
    const { x, y } = enemy;

    const directions = ["top", "bottom", "left", "right"];
    const randomDirectionIndex = this.generateRandomNum(0, 3);
    const randomWalkDirection = directions[randomDirectionIndex];

    const move = (newX, newY) => {
      if (this.isWalkableTile(newX, newY)) {
        this.map[newY][newX] = TILES.tileE;

        // Проверка: был ли блок, на котором стоял враг, предметом
        // если да, то возвращаем его назад
        if (this.swords.some((sword) => sword.x === x && sword.y === y)) {
          this.map[y][x] = TILES.tileSW;
        }
        if (this.healthPotions.some((hp) => hp.x === x && hp.y === y)) {
          this.map[y][x] = TILES.tileHP;
        } else {
          this.map[y][x] = TILES.tile;
        }

        enemyBlock.style.left = newX * this.pixelX + "px";
        enemyBlock.style.top = newY * this.pixelY + "px";
        enemy.x = newX;
        enemy.y = newY;
      }
    };

    switch (randomWalkDirection) {
      case "top":
        move(x, y - 1);
        break;
      case "bottom":
        move(x, y + 1);
        break;
      case "left":
        move(x - 1, y);
        break;
      case "right":
        move(x + 1, y);
        break;
    }
  }

  isWalkableTile(x, y) {
    if (
      x >= this.cols ||
      x < 0 ||
      y < 0 ||
      y >= this.rows ||
      this.map[y][x] === TILES.tileE ||
      this.map[y][x] === TILES.tileW ||
      this.map[y][x] === TILES.tileP
    )
      return false;
    else return true;
  }

  getHeroBlock() {
    return document.querySelector("." + TILES.tileP);
  }

  updateBlock(col, row) {
    // Обновление визуального отображения блока на поле
    const blocks = this.getBlocks();
    const index = row * this.cols + col;
    blocks[index].className = this.map[row][col];
  }

  attack() {
    const targets = this.getTargetsAround();

    if (!targets.length) return;

    // const enemyBlocks = document.querySelectorAll("." + TILES.tileE);
    for (let i = 0; i < targets.length; i++) {
      const enemy = targets[i];

      if (enemy.health > 0) {
        enemy.health -= this.hero.damage;
      }

      if (enemy.health <= 0) {
        this.killEnemy(enemy);
        // enemy.clearBehaviorInterval();
        console.log("убит");
        continue;
      }

      // const enemyHealthBlock = enemyBlocks[enemy.id - 1].children[0];
      const enemyHealthBlock = this.getEnemyHealthBlock(enemy);
      enemyHealthBlock.style.width = enemy.health + "%";
    }
  }

  getEnemyHealthBlock(enemy) {
    const enemyBlocks = document.querySelectorAll("." + TILES.tileE);
    const enemyHealthBlock = enemyBlocks[enemy.id - 1].children[0];
    return enemyHealthBlock;
  }

  killEnemy(enemy) {
    if (!enemy) return;

    this.map[enemy.y][enemy.x] += " killed";

    const enemyBlock = this.getEnemyBlockById(enemy.id);
    enemyBlock.classList.add("killed");
    const enemyHealthBlock = enemyBlock.children[0];
    enemyHealthBlock.style.width = 0 + "px";

    // удаление врага из массива
    this.enemies = this.enemies.filter((e) => e.id !== enemy.id);
  }

  getEnemyBlockById(id) {
    return document.querySelectorAll("." + TILES.tileE)[id - 1];
  }

  getTargetsAround() {
    const { x, y } = this.hero;
    const targets = [];

    const targetEntityLeft = this.getEnemiesAt(x - 1, y);
    targetEntityLeft && targets.push(targetEntityLeft);

    const targetEntityRight = this.getEnemiesAt(x + 1, y);
    targetEntityRight && targets.push(targetEntityRight);

    const targetEntityTop = this.getEnemiesAt(x, y - 1);
    targetEntityTop && targets.push(targetEntityTop);

    const targetEntityBottom = this.getEnemiesAt(x, y + 1);
    targetEntityBottom && targets.push(targetEntityBottom);

    return targets;
  }

  getEnemiesAt(x, y) {
    return this.enemies.find((enemy) => enemy.x === x && enemy.y === y);
  }

  generateRandomRooms(min, max) {
    return this.generateRandomNum(min, max);
  }

  generateRandomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  findEmptyCell() {
    for (let attempt = 0; attempt < 100; attempt++) {
      const x = this.generateRandomNum(0, this.cols - 1);
      const y = this.generateRandomNum(0, this.rows - 1);

      if (this.map[y][x] === "tile") {
        return [x, y];
      }
    }

    return null;
  }

  getField() {
    return document.querySelector(".field");
  }

  createBlock(className, col, row) {
    const div = document.createElement("div");
    div.className = className;
    div.style.left = col * this.pixelX + "px";
    div.style.top = row * this.pixelY + "px";
    div.style.width = this.pixelX + "px";
    div.style.height = this.pixelY + "px";

    return div;
  }

  createHealthBlock() {
    const healthBlock = document.createElement("div");
    healthBlock.className = "health";
    healthBlock.style.width = "100%";
    return healthBlock;
  }

  getBlocks() {
    return document.querySelectorAll(".field div");
  }
}
