/**
 * هياكل البيانات (Data Structures) المستخدمة فى محرك yajib.app
 * ------------------------------------------------------------------
 * كل هيكل عام (Generic) ويمكن إعادة استخدامه.
 */

/** عقدة فى القائمة المرتبطة تُستخدم داخل الطابور */
class QNode<T> {
  value: T;
  next: QNode<T> | null = null;
  constructor(value: T) {
    this.value = value;
  }
}

/**
 * Queue<T> — طابور FIFO مبنى بقائمة مرتبطة.
 * يستخدمه المطعم لمعالجة الطلبات بترتيب وصولها.
 * enqueue / dequeue بتعقيد زمنى O(1).
 */
export class Queue<T> {
  private head: QNode<T> | null = null;
  private tail: QNode<T> | null = null;
  private _size = 0;

  enqueue(value: T): void {
    const node = new QNode(value);
    if (this.tail) {
      this.tail.next = node;
      this.tail = node;
    } else {
      this.head = this.tail = node;
    }
    this._size++;
  }

  dequeue(): T | undefined {
    if (!this.head) return undefined;
    const value = this.head.value;
    this.head = this.head.next;
    if (!this.head) this.tail = null;
    this._size--;
    return value;
  }

  peek(): T | undefined {
    return this.head?.value;
  }

  get size(): number {
    return this._size;
  }

  isEmpty(): boolean {
    return this._size === 0;
  }

  toArray(): T[] {
    const out: T[] = [];
    let cur = this.head;
    while (cur) {
      out.push(cur.value);
      cur = cur.next;
    }
    return out;
  }
}

/**
 * MinHeap<T> — كومة صغرى (Priority Queue) عامة.
 * تُستخدم لاختيار أقرب سائق (أقل مسافة) بكفاءة.
 * insert / extractMin بتعقيد O(log n).
 */
export class MinHeap<T> {
  private data: T[] = [];
  private score: (item: T) => number;

  constructor(scoreFn: (item: T) => number) {
    this.score = scoreFn;
  }

  get size(): number {
    return this.data.length;
  }

  insert(item: T): void {
    this.data.push(item);
    this.bubbleUp(this.data.length - 1);
  }

  extractMin(): T | undefined {
    if (this.data.length === 0) return undefined;
    const min = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.bubbleDown(0);
    }
    return min;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.score(this.data[i]) >= this.score(this.data[parent])) break;
      [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
      i = parent;
    }
  }

  private bubbleDown(i: number): void {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.score(this.data[l]) < this.score(this.data[smallest]))
        smallest = l;
      if (r < n && this.score(this.data[r]) < this.score(this.data[smallest]))
        smallest = r;
      if (smallest === i) break;
      [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
      i = smallest;
    }
  }
}
