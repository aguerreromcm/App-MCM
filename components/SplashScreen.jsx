import { useEffect, useRef } from "react"
import { Animated, Dimensions } from "react-native"
import { COLORS, images } from "../constants"

const { width, height } = Dimensions.get("window")

export default function SplashScreen({ onFinish }) {
    const logoScale = useRef(new Animated.Value(0)).current
    const logoOpacity = useRef(new Animated.Value(0)).current
    const backgroundOpacity = useRef(new Animated.Value(1)).current

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true
                }),
                Animated.spring(logoScale, {
                    toValue: 1.5,
                    duration: 800,
                    useNativeDriver: true
                })
            ]),
            Animated.delay(1500),
            Animated.parallel([
                Animated.timing(logoOpacity, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true
                }),
                Animated.timing(backgroundOpacity, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true
                })
            ])
        ]).start(() => {
            if (onFinish) onFinish()
        })
    }, [backgroundOpacity, logoOpacity, logoScale, onFinish])

    return (
        <Animated.View
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width,
                height,
                backgroundColor: COLORS.primary,
                justifyContent: "center",
                alignItems: "center",
                opacity: backgroundOpacity,
                zIndex: 9999
            }}
        >
            <Animated.Image
                source={images.splash}
                style={{
                    width: 200,
                    height: 200,
                    transform: [{ scale: logoScale }],
                    opacity: logoOpacity,
                    dropShadow: {
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5
                    }
                }}
                resizeMode="contain"
            />
        </Animated.View>
    )
}
