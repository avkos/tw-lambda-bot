export default {
    tables: {
        hold: process.env.DYNAMODB_HOLD_TABLE as string,
        setting: process.env.DYNAMODB_SETTING_TABLE as string,
        strategy: process.env.DYNAMODB_STRATEGY_TABLE as string,
    },
    binance: {
        key: process.env.BINANCE_API_KEY as string,
        secret: process.env.BINANCE_API_SECRET as string
    },
    strategy: {
        type: 'most',
        asset: 'ETH',
        currency: 'USDT',
        defaultSetting: {isReuseHold: true, riskPercent: 0.05, minAmountUSDT: 11}
    },
    user: {
        email: 'admin@admin.com'
    },
    cognito: {
        userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
        clientId: process.env.AWS_COGNITO_APP_CLIENT_ID,
        region: process.env.AWS_COGNITO_REGION,
    }
}