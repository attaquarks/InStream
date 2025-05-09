import React, { useState, ChangeEvent } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  SelectChangeEvent,
  Theme
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledForm = styled('form')(({ theme }: { theme: Theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  maxWidth: 600,
  margin: '0 auto',
  padding: theme.spacing(3),
}));

interface Source {
  value: string;
  label: string;
}

const DataCollection: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [sources, setSources] = useState<string[]>(['all']);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const availableSources: Source[] = [
    { value: 'all', label: 'All Sources' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'reddit', label: 'Reddit' },
    { value: 'news', label: 'News' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'linkedin', label: 'LinkedIn' },
  ];

  const handleSourceChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSources(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('http://localhost:5000/api/collect-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword,
          sources,
          days,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Successfully collected ${data.data.count} posts from ${data.data.sources.join(', ')}`);
      } else {
        setError(data.message || 'Failed to collect data');
      }
    } catch (err) {
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Data Collection
      </Typography>
      
      <StyledForm onSubmit={handleSubmit}>
        <TextField
          label="Keyword"
          value={keyword}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)}
          required
          fullWidth
          placeholder="Enter keyword to search for"
        />

        <FormControl fullWidth>
          <InputLabel>Data Sources</InputLabel>
          <Select
            multiple
            value={sources}
            onChange={handleSourceChange}
            renderValue={(selected: string[]) => (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {selected.map((value: string) => (
                  <Chip
                    key={value}
                    label={availableSources.find(s => s.value === value)?.label || value}
                  />
                ))}
              </Stack>
            )}
          >
            {availableSources.map((source) => (
              <MenuItem key={source.value} value={source.value}>
                {source.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Days to Collect"
          type="number"
          value={days}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDays(Number(e.target.value))}
          inputProps={{ min: 1, max: 30 }}
          fullWidth
        />

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading || !keyword}
          fullWidth
        >
          {loading ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Collecting Data...
            </>
          ) : (
            'Collect Data'
          )}
        </Button>
      </StyledForm>
    </Box>
  );
};

export default DataCollection; 