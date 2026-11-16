export function formatoPrecio(precio: number) {
    return '$ ' + String(precio).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function numeroDeMesa(nombre: string) {
    return nombre.replace(/\D/g, '');
}