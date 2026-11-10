import { Pipe, PipeTransform } from "@angular/core";

export interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
}

@Pipe({
  name: "filtrarProductos",
  pure: false, // Solo si necesitas que se ejecute en cada ciclo
})
export class FiltrarProductosPipe implements PipeTransform {
  transform(productos: Producto[], filtro: string): Producto[] {
    if (!productos || !filtro) {
      return productos;
    }

    const filtroLower = filtro.toLowerCase();

    return productos.filter(
      (producto) =>
        producto.nombre.toLowerCase().includes(filtroLower) ||
        producto.categoria.toLowerCase().includes(filtroLower)
    );
  }
}
