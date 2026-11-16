// 45000 -> "$ 45.000"
export function formatoPrecio(precio: number) {
    return '$ ' + String(precio).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// "Mesa 3" -> "3"
export function numeroDeMesa(nombre: string) {
    return nombre.replace(/\D/g, '');
}