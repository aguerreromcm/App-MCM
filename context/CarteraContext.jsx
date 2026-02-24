import { createContext, useContext, useState, useEffect } from "react"
import { catalogos } from "../services"
import storage from "../utils/storage"

const STORAGE_KEYS = {
    clientes: "cartera_clientes",
    detalleOperaciones: "cartera_detalle_operaciones",
    resumenDiario: "cartera_resumen_diario",
    lastUpdate: "cartera_last_update"
}

const CarteraContext = createContext()

export const useCartera = () => {
    const context = useContext(CarteraContext)
    if (!context) {
        throw new Error("useCartera debe ser usado dentro de CarteraProvider")
    }
    return context
}

export const CarteraProvider = ({ children }) => {
    const [clientes, setClientes] = useState([])
    const [loading, setLoading] = useState(false)
    const [lastUpdate, setLastUpdate] = useState(null)
    const [detalleOperaciones, setDetalleOperaciones] = useState([])
    const [resumenDiario, setResumenDiario] = useState(null)

    // Función para obtener todos los créditos de la cartera
    const obtenerCartera = async (forzarActualizacion = false) => {
        try {
            // Solo actualizar si no hay datos o si se fuerza la actualización
            // o si han pasado más de 24 horas desde la última actualización
            const ahora = Date.now()
            const tiempoLimite = 24 * 60 * 60 * 1000 // 24 horas

            if (
                !forzarActualizacion &&
                clientes.length > 0 &&
                lastUpdate &&
                ahora - lastUpdate < tiempoLimite
            ) {
                return { success: true, data: clientes }
            }

            setLoading(true)
            const respuesta = await catalogos.getClientesEjecutivo()
            const nuevosClientes = respuesta.data.clientes || []
            const operaciones = respuesta.data.detalle_operaciones || []
            const resumen = respuesta.data.resumen_diario || null

            setClientes(nuevosClientes)
            setDetalleOperaciones(operaciones)
            setResumenDiario(resumen)
            setLastUpdate(ahora)

            // Persistir en almacenamiento local para sobrevivir reinicios
            await Promise.all([
                storage.setItem(STORAGE_KEYS.clientes, nuevosClientes),
                storage.setItem(STORAGE_KEYS.detalleOperaciones, operaciones),
                storage.setItem(STORAGE_KEYS.resumenDiario, resumen),
                storage.setItem(STORAGE_KEYS.lastUpdate, ahora)
            ])

            return { success: true, data: nuevosClientes }
        } catch (error) {
            console.error("Error al obtener cartera:", error)
            return { success: false, error: error.message }
        } finally {
            setLoading(false)
        }
    }

    // Función para validar si un número de crédito existe en la cartera
    const validarCredito = (numeroCredito) => {
        if (!numeroCredito || numeroCredito.length !== 6) {
            return { valido: false, mensaje: "El número de crédito debe tener 6 dígitos" }
        }

        const creditoEncontrado = clientes.find((cliente) => cliente.cdgns === numeroCredito)

        if (creditoEncontrado) {
            return {
                valido: true,
                cliente: creditoEncontrado,
                mensaje: `Crédito válido - ${creditoEncontrado.nombre}`
            }
        } else {
            return {
                valido: false,
                mensaje: "El número de crédito no se encuentra en su cartera"
            }
        }
    }

    // Función para obtener información específica de un crédito
    const obtenerInfoCredito = (numeroCredito) => {
        return clientes.find((cliente) => cliente.cdgns === numeroCredito) || null
    }

    // Función para obtener detalle de operaciones del cache
    const obtenerDetalleOperaciones = () => {
        return detalleOperaciones ? [...detalleOperaciones] : []
    }

    // Función para obtener resumen diario del cache
    const obtenerResumenDiario = () => {
        return resumenDiario ? { ...resumenDiario } : null
    }

    // Función para limpiar la caché (memoria y almacenamiento local)
    const limpiarCache = async () => {
        setClientes([])
        setDetalleOperaciones([])
        setResumenDiario(null)
        setLastUpdate(null)
        await Promise.all([
            storage.setItem(STORAGE_KEYS.clientes, []),
            storage.setItem(STORAGE_KEYS.detalleOperaciones, []),
            storage.setItem(STORAGE_KEYS.resumenDiario, null),
            storage.setItem(STORAGE_KEYS.lastUpdate, null)
        ])
    }

    // Cargar datos persistidos desde almacenamiento local al montar el provider
    useEffect(() => {
        const cargarDesdeStorage = async () => {
            try {
                const [
                    clientesGuardados,
                    operacionesGuardadas,
                    resumenGuardado,
                    lastUpdateGuardado
                ] = await Promise.all([
                    storage.getItem(STORAGE_KEYS.clientes),
                    storage.getItem(STORAGE_KEYS.detalleOperaciones),
                    storage.getItem(STORAGE_KEYS.resumenDiario),
                    storage.getItem(STORAGE_KEYS.lastUpdate)
                ])

                if (clientesGuardados && clientesGuardados.length > 0) {
                    setClientes(clientesGuardados)
                    setDetalleOperaciones(operacionesGuardadas || [])
                    setResumenDiario(resumenGuardado || null)
                    setLastUpdate(lastUpdateGuardado || null)
                }
            } catch (error) {
                console.error("Error al cargar cartera desde storage:", error)
            } finally {
                // Después de restaurar el estado local, verificar si hay actualización pendiente
                obtenerCartera()
            }
        }

        cargarDesdeStorage()
    }, [])

    const value = {
        clientes,
        loading,
        lastUpdate,
        detalleOperaciones,
        resumenDiario,
        obtenerCartera,
        validarCredito,
        obtenerInfoCredito,
        obtenerDetalleOperaciones,
        obtenerResumenDiario,
        limpiarCache
    }

    return <CarteraContext.Provider value={value}>{children}</CarteraContext.Provider>
}
