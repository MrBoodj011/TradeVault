-- Create the backtest_trades table
CREATE TABLE backtest_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Keep simple or reference auth.users(id) if auth is used. Note: if auth is not fully configured, you can link to auth.users or keep as UUID.
    asset VARCHAR(255) NOT NULL DEFAULT 'EURUSD',
    entry_model VARCHAR(255) NOT NULL,
    risk_reward NUMERIC(5,2) NOT NULL DEFAULT 3.0,
    result VARCHAR(50) NOT NULL, -- 'Win', 'Loss', 'Breakeven'
    pnl_percentage NUMERIC(5,2) NOT NULL,
    trade_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE backtest_trades ENABLE ROW LEVEL SECURITY;

-- Create Policies (Assuming auth.users is used for authentication)
CREATE POLICY "Users can insert their own trades" ON backtest_trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own trades" ON backtest_trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades" ON backtest_trades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades" ON backtest_trades
    FOR DELETE USING (auth.uid() = user_id);
