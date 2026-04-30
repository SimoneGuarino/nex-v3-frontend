import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const Loader = () => {
  return (
    <Box component="div"  id="Loader" sx={{ display: 'flex' }}>
      <CircularProgress />
    </Box>
  );
};

export default Loader;
