import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { View, Text, Modal, Pressable, Animated } from "react-native"
import { Feather } from "@expo/vector-icons"
import { COLORS } from "../constants"

const messageTypes = {
    success: {
        icon: "check-circle",
        color: "#10B981", // green-500
        backgroundColor: "#ECFDF5", // green-50
        borderColor: "#A7F3D0" // green-200
    },
    error: {
        icon: "x-circle",
        color: "#EF4444", // red-500
        backgroundColor: "#FEF2F2", // red-50
        borderColor: "#FECACA" // red-200
    },
    warning: {
        icon: "alert-triangle",
        color: "#F59E0B", // yellow-500
        backgroundColor: "#FFFBEB", // yellow-50
        borderColor: "#FED7AA" // yellow-200
    },
    info: {
        icon: "info",
        color: "#3B82F6", // blue-500
        backgroundColor: "#EFF6FF", // blue-50
        borderColor: "#BFDBFE" // blue-200
    },
    simple: {
        icon: "message-circle",
        color: COLORS.primary,
        backgroundColor: "#F8FAFC", // gray-50
        borderColor: "#E2E8F0" // gray-200
    }
}

export default forwardRef(function CustomAlert(props, ref) {
    const [visible, setVisible] = useState(false)
    const [waitVisible, setWaitVisible] = useState(false)
    const [waitConfig, setWaitConfig] = useState({
        title: "",
        message: ""
    })
    const [config, setConfig] = useState({
        type: "simple",
        title: "",
        message: "",
        buttons: []
    })
    const [fadeAnim] = useState(new Animated.Value(0))
    const [scaleAnim] = useState(new Animated.Value(0.8))
    const [waitFadeAnim] = useState(new Animated.Value(0))
    const [waitRotateAnim] = useState(new Animated.Value(0))

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true
                })
            ]).start()
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.8,
                    duration: 150,
                    useNativeDriver: true
                })
            ]).start()
        }
    }, [visible, fadeAnim, scaleAnim])

    useEffect(() => {
        if (waitVisible) {
            // Animación de entrada del modal de espera
            Animated.timing(waitFadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            }).start()

            // Animación continua de rotación del spinner
            const rotate = () => {
                waitRotateAnim.setValue(0)
                Animated.timing(waitRotateAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true
                }).start(() => {
                    if (waitVisible) rotate()
                })
            }
            rotate()
        } else {
            Animated.timing(waitFadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true
            }).start()
        }
    }, [waitVisible, waitFadeAnim, waitRotateAnim])

    const showAlert = (type = "simple", title, message, buttons = []) => {
        const defaultButtons =
            buttons.length > 0
                ? buttons
                : [
                      {
                          text: "OK",
                          onPress: () => hideAlert(),
                          style: "default"
                      }
                  ]

        setConfig({
            type,
            title,
            message,
            buttons: defaultButtons
        })
        setVisible(true)
    }

    const hideAlert = () => {
        setVisible(false)
    }

    const showWait = (title, message) => {
        setWaitConfig({
            title,
            message
        })
        setWaitVisible(true)
    }

    const hideWait = () => {
        setWaitVisible(false)
    }

    // Exponer las funciones a través de la ref
    useImperativeHandle(ref, () => ({
        showAlert,
        hideAlert,
        showWait,
        hideWait
    }))

    const currentType = messageTypes[config.type] || messageTypes.simple

    return (
        <>
            {/* Modal Principal de Alertas */}
            <Modal
                visible={visible}
                transparent={true}
                animationType="none"
                onRequestClose={() => setVisible(false)}
                statusBarTranslucent={true}
            >
                <Animated.View
                    className="flex-1 justify-center items-center px-6"
                    style={{
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        opacity: fadeAnim
                    }}
                >
                    <Animated.View
                        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
                        style={{
                            transform: [{ scale: scaleAnim }]
                        }}
                    >
                        <View className="items-center mb-6">
                            <View
                                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                                style={{ backgroundColor: `${currentType.color}20` }}
                            >
                                <Feather
                                    name={currentType.icon}
                                    size={32}
                                    color={currentType.color}
                                />
                            </View>
                            <Text
                                className="text-xl font-bold text-center mb-2"
                                style={{ color: "#1F2937" }}
                            >
                                {config.title}
                            </Text>
                            {config.message && (
                                <Text
                                    className="text-base text-center leading-6"
                                    style={{ color: "#4B5563" }}
                                >
                                    {config.message}
                                </Text>
                            )}
                        </View>

                        <View
                            className={`${
                                config.buttons.length > 1 ? "flex-row" : "flex-col"
                            } justify-center`}
                        >
                            {config.buttons.map((button, index) => {
                                const isLastButton = index === config.buttons.length - 1
                                const isCancelButton = button.style === "cancel"
                                const isDestructiveButton = button.style === "destructive"

                                const buttonStyle = {
                                    backgroundColor: isCancelButton
                                        ? "transparent"
                                        : isDestructiveButton
                                        ? "#EF4444"
                                        : currentType.color,
                                    textColor: isCancelButton ? "#6B7280" : "#FFFFFF",
                                    borderColor: isCancelButton ? "#D1D5DB" : "transparent"
                                }

                                return (
                                    <Pressable
                                        key={index}
                                        onPress={() => {
                                            button.onPress?.()
                                            hideAlert()
                                        }}
                                        className={`h-12 rounded-xl justify-center items-center ${
                                            config.buttons.length > 1
                                                ? `flex-1 ${!isLastButton ? "mr-3" : ""}`
                                                : "w-full"
                                        }`}
                                        style={{
                                            backgroundColor: buttonStyle.backgroundColor,
                                            borderWidth: isCancelButton ? 1 : 0,
                                            borderColor: buttonStyle.borderColor || "transparent"
                                        }}
                                    >
                                        <Text
                                            className="font-semibold text-base"
                                            style={{ color: buttonStyle.textColor }}
                                        >
                                            {button.text}
                                        </Text>
                                    </Pressable>
                                )
                            })}
                        </View>
                    </Animated.View>
                </Animated.View>
            </Modal>

            {/* Modal de Espera */}
            <Modal
                visible={waitVisible}
                transparent={true}
                animationType="none"
                statusBarTranslucent={true}
            >
                <Animated.View
                    className="flex-1 justify-center items-center"
                    style={{
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        opacity: waitFadeAnim
                    }}
                >
                    <View className="bg-white rounded-3xl p-8 m-6 items-center max-w-sm w-full">
                        {/* Spinner de carga */}
                        <Animated.View
                            style={{
                                transform: [
                                    {
                                        rotate: waitRotateAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ["0deg", "360deg"]
                                        })
                                    }
                                ]
                            }}
                            className="mb-6"
                        >
                            <Feather name="loader" size={48} color="#3B82F6" />
                        </Animated.View>

                        {/* Título */}
                        <Text className="text-xl font-bold text-gray-800 mb-3 text-center">
                            {waitConfig.title}
                        </Text>

                        {/* Mensaje */}
                        <Text className="text-base text-gray-600 text-center leading-6">
                            {waitConfig.message}
                        </Text>
                    </View>
                </Animated.View>
            </Modal>
        </>
    )
})

// Función helper para mostrar alertas rápidamente (deprecated)
export const showAlert = (type, title, message, buttons) => {
    console.warn("Use useCustomAlert hook instead of showAlert function")
}
