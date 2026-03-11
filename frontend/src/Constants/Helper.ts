export const formatStatusRoom = (status: number) => {
  switch (status) {
    case 1:
      return "Phòng trống";

    case 2:
      return "Phòng đang ở";

    case 3:
      return "Phòng đang sửa";

    case 4:
      return "Phòng đặt chỗ";
  }
};
