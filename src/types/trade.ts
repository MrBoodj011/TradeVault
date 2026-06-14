export interface Trade {
  id: string;
  user_id: string;
  asset: string;
  entry_model: 'FVG post-sweep' | 'Balanced Price Range' | 'Turtle Soup sweep' | 'Other';
  risk_reward: number;
  result: 'Win' | 'Loss' | 'Breakeven';
  pnl_percentage: number;
  trade_date: string;
  notes?: string;
  screenshot_url?: string;
  created_at?: string;
}
