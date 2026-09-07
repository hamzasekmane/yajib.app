/**
 * نماذج المجال (Domain Models) — تطبيق مبادئ OOP:
 * التغليف (Encapsulation)، الوراثة (Inheritance)، تعدد الأشكال (Polymorphism).
 */
import { GeoPoint, haversineKm, calcDeliveryFee } from "./geo";
import { MinHeap } from "./structures";

/** كلاس أساسى مجرد لكل مشارك على المنصة */
export abstract class Participant {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public location: GeoPoint,
  ) {}

  /** تعدد أشكال: كل نوع مستخدم يصف دوره */
  abstract describeRole(): string;

  distanceTo(point: GeoPoint): number {
    return haversineKm(this.location, point);
  }
}

export class Customer extends Participant {
  describeRole(): string {
    return "زبون يبحث عن الطعام";
  }
}

export class RestaurantOwner extends Participant {
  describeRole(): string {
    return "صاحب مطعم";
  }
}

export class DeliveryDriver extends Participant {
  constructor(
    id: number,
    name: string,
    location: GeoPoint,
    public isOnline: boolean,
    public rating: number,
    public deliveriesCount: number,
  ) {
    super(id, name, location);
  }

  describeRole(): string {
    return "سائق توصيل (دراجة)";
  }

  /** درجة الأولوية: كلما قلّت كانت أفضل (مسافة أقل + تقييم أعلى) */
  priorityScore(pickup: GeoPoint): number {
    const dist = this.distanceTo(pickup);
    const ratingPenalty = (5 - this.rating) * 0.5;
    return dist + ratingPenalty;
  }
}

/**
 * DriverAssignmentService — خوارزمية إسناد السائق الأمثل.
 * تستخدم MinHeap لاختيار السائق ذى أقل درجة أولوية (أقرب + أعلى تقييم).
 * التعقيد: O(n log n) لبناء الكومة، O(log n) للاستخراج.
 */
export class DriverAssignmentService {
  static findBestDriver(
    drivers: DeliveryDriver[],
    pickup: GeoPoint,
  ): DeliveryDriver | null {
    const heap = new MinHeap<DeliveryDriver>((d) => d.priorityScore(pickup));
    for (const d of drivers) {
      if (d.isOnline) heap.insert(d);
    }
    return heap.extractMin() ?? null;
  }

  /** ترتيب كل السائقين المتاحين حسب الأفضلية */
  static rankDrivers(
    drivers: DeliveryDriver[],
    pickup: GeoPoint,
  ): DeliveryDriver[] {
    const heap = new MinHeap<DeliveryDriver>((d) => d.priorityScore(pickup));
    for (const d of drivers) if (d.isOnline) heap.insert(d);
    const ranked: DeliveryDriver[] = [];
    let next = heap.extractMin();
    while (next) {
      ranked.push(next);
      next = heap.extractMin();
    }
    return ranked;
  }
}

/** حساب تكلفة طلب كاملة */
export function quoteOrder(
  subtotal: number,
  restaurant: GeoPoint,
  destination: GeoPoint,
): { distanceKm: number; deliveryFee: number; total: number } {
  const distanceKm = Math.round(haversineKm(restaurant, destination) * 100) / 100;
  const deliveryFee = calcDeliveryFee(distanceKm);
  const total = Math.round((subtotal + deliveryFee) * 100) / 100;
  return { distanceKm, deliveryFee, total };
}
