export interface Car {
  id: string;
  numberPlate: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ActiveCarContextType {
  cars: Car[];
  activeCar: Car | null;
  addCar: (numberPlate: string) => Promise<boolean>;
  deleteCar: (id: string) => Promise<boolean>;
  setActiveCar: (carId: string) => Promise<boolean>;
  loadCars: () => Promise<void>;
}