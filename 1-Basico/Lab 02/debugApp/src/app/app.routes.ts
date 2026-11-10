import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "/counter",
    pathMatch: "full",
  },
  {
    path: "counter",
    loadComponent: () =>
      import("./features/counter/counter").then(
        (m) => m.Counter
      ),
    title: "Counter - Debug App",
  },
  {
    path: "users",
    loadComponent: () =>
      import("./features/user-list/user-list").then(
        (m) => m.UserList
      ),
    title: "Users - Debug App",
  },
  {
    path: "**",
    redirectTo: "/counter",
  },
];
