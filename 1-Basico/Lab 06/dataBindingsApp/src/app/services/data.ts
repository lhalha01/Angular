import { Injectable } from "@angular/core";
import { Observable, of, throwError, delay } from "rxjs";

export interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  active: boolean;
  profile?: {
    description: string;
  };
}

@Injectable({
  providedIn: "root",
})
export class Data {
  private mockUsers: User[] = [
    {
      id: 1,
      name: "Ana García",
      email: "ana@example.com",
      age: 28,
      active: true,
      profile: { description: "Desarrolladora Frontend" },
    },
    {
      id: 2,
      name: "Carlos López",
      email: "carlos@example.com",
      age: 35,
      active: true,
      // Bug intencional: sin profile
    },
    {
      id: 3,
      name: "María Rodríguez",
      email: "maria@example.com",
      age: 31,
      active: false,
      profile: { description: "Diseñadora UX" },
    },
    {
      id: 4,
      name: "José Martínez",
      email: "jose@example.com",
      age: 42,
      active: true,
    },
  ];

  constructor() {
    console.log("Data initialized");
  }

  getUsers(): Observable<User[]> {
    console.log("Data: Getting users...");

    // Simular delay de red
    return of([...this.mockUsers]).pipe(delay(1000));
  }

  getUsersWithError(): Observable<User[]> {
    console.log("Data: Getting users with error...");

    return throwError(() => new Error("Simulated network error")).pipe(
      delay(1000)
    );
  }

  getUserById(id: number): Observable<User | null> {
    console.log(`Data: Getting user with id ${id}`);

    const user = this.mockUsers.find((u) => u.id === id) || null;
    return of(user).pipe(delay(500));
  }

  updateUser(user: User): Observable<User> {
    console.log("Data: Updating user", user);

    const index = this.mockUsers.findIndex((u) => u.id === user.id);
    if (index !== -1) {
      this.mockUsers[index] = { ...user };
      return of(this.mockUsers[index]).pipe(delay(300));
    }

    return throwError(() => new Error("User not found"));
  }
}
